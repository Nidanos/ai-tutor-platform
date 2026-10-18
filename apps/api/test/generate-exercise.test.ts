import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { exercises, exerciseTests, generationFailures, generationJobs } from "../src/infrastructure/database/schema/index.js";
import type { LlmProvider } from "../src/infrastructure/llm/llm-provider.js";
import type { SandboxProvider } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { TASK } from "../src/modules/m6_exercises/services/exercise-draft.js";
import { runGeneration } from "../src/modules/m6_exercises/services/generate-exercise.js";
import { createCourse, createSkill, exerciseRow } from "./helpers.js";

const EXPECTED = ["4", "0", "-6"];
const REFERENCE = "int twice(int n) { return 2 * n; }"; // the fake sandbox passes only this...
const PROGRAM = "int main() { std::cout << 2 * 2; }"; // ...and this rung-1 program
const WRONG = ["int twice(int n) { return n; }", "int twice(int n) { return n + 2; }", "int twice(int n) { return n * n; }"];

const draft = (overrides: object = {}) =>
  JSON.stringify({
    title: "Twice",
    promptMd: "Return twice the value of `n`.",
    functionSignature: "int twice(int n)",
    call: "std::cout << twice({{args}});",
    starterCode: "int twice(int n) { return 0; }",
    reference: REFERENCE,
    cases: EXPECTED.map((expected, i) => ({ args: ["2", "0", "-3"][i], expected })),
    wrongSolutions: WRONG,
    ...overrides,
  });

// A fake Gemini that replies with these texts in turn.
const llm = (...replies: string[]) => {
  const generate = vi.fn<LlmProvider["generate"]>();
  replies.forEach((text) => generate.mockResolvedValueOnce({ text, callId: 0 }));
  return { generate };
};

const sandbox: SandboxProvider = {
  run: async ({ files, tests }) => ({
    sandboxId: "fake",
    compile: { ok: true, output: "" },
    tests: tests.map((seq) => ({
      exitCode: 0,
      timedOut: false,
      timeMs: 1,
      peakMemoryKb: 1,
      stdout: [REFERENCE, PROGRAM].includes(files["solution.cpp"]) ? EXPECTED[seq - 1] : "wrong",
      stderr: "",
    })),
  }),
};

async function job(rung = 3) {
  const skill = await createSkill((await createCourse()).id);
  const [created] = await db
    .insert(generationJobs)
    .values({ skillId: skill.id, languageCode: "cpp", rung, variantSeed: 1000, trigger: "pregen", model: "gemini-3.8-flash", promptVersion: "test" })
    .returning();
  return { skill, job: created };
}
const jobRow = async (id: string) => (await db.select().from(generationJobs).where(eq(generationJobs.id, id)))[0];
const failures = async (id: string) => (await db.select().from(generationFailures).where(eq(generationFailures.generationJobId, id))).map((f) => f.stage);

describe("exercise generation", () => {
  it("stores a draft the sandbox proves, verified and ready to serve", async () => {
    const { skill, job: j } = await job();
    const exerciseId = await runGeneration(j.id, llm(draft()), sandbox);

    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId!));
    expect(exercise).toMatchObject({ skillId: skill.id, rung: 3, status: "verified", source: "generated", purpose: "practice", variantSeed: 1000, title: "Twice" });
    expect(exercise.promptMd.endsWith(TASK)).toBe(true);
    expect(await db.select().from(exerciseTests).where(eq(exerciseTests.exerciseId, exerciseId!))).toHaveLength(3);
    expect(await jobRow(j.id)).toMatchObject({ status: "succeeded", tries: 1, exerciseId, model: "gemini-3.8-flash" });
  });

  it("tries again after a bad reply, telling the model what was wrong", async () => {
    const { job: j } = await job();
    const provider = llm("not json", draft());
    expect(await runGeneration(j.id, provider, sandbox)).toBeDefined();
    expect(await failures(j.id)).toEqual(["schema"]);
    expect(provider.generate.mock.calls[1][0].prompt).toContain("Your previous draft was rejected: the reply wasn't valid JSON.");
    expect(await jobRow(j.id)).toMatchObject({ status: "succeeded", tries: 2 });
  });

  it("rejects tests a wrong solution passes, tries Pro last, then falls back to the hand-written exercise", async () => {
    const { skill, job: j } = await job();
    const [template] = await db.insert(exercises).values({ ...exerciseRow(skill.id, 3), status: "verified" }).returning();
    const weak = draft({ wrongSolutions: [WRONG[0], REFERENCE, WRONG[2]] }); // the 2nd "mistake" is correct, so it passes
    const provider = llm(weak, weak, weak);

    expect(await runGeneration(j.id, provider, sandbox)).toBeUndefined();
    expect(provider.generate.mock.calls.map((c) => c[0].model)).toEqual(["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.1-pro-preview"]);
    expect(await failures(j.id)).toEqual(["tests_too_weak", "tests_too_weak", "tests_too_weak"]);
    expect(await jobRow(j.id)).toMatchObject({ status: "fell_back", tries: 3, fallbackExerciseId: template.id });
    const generated = await db.select().from(exercises).where(eq(exercises.skillId, skill.id));
    expect(generated.filter((e) => e.source === "generated")).toHaveLength(0);
  });

  it("checks a predict-the-output draft's claimed output by running the program", async () => {
    const { job: j } = await job(1);
    const exerciseId = await runGeneration(j.id, llm(JSON.stringify({ title: "Doubling", program: PROGRAM, expectedOutput: "4" })), sandbox);
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId!));
    expect(exercise).toMatchObject({ rung: 1, title: "What does it print? Doubling", starterCode: PROGRAM, functionSignature: null });

    const { job: wrongClaim } = await job(1);
    const claimsWrongly = JSON.stringify({ title: "Doubling", program: PROGRAM, expectedOutput: "5" });
    expect(await runGeneration(wrongClaim.id, llm(claimsWrongly, claimsWrongly, claimsWrongly), sandbox)).toBeUndefined();
    expect(await failures(wrongClaim.id)).toEqual(["reference", "reference", "reference"]);
  });

  it("does nothing for a job that has already finished", async () => {
    const { job: j } = await job();
    await db.update(generationJobs).set({ status: "succeeded" }).where(eq(generationJobs.id, j.id));
    const provider = llm(draft());
    expect(await runGeneration(j.id, provider, sandbox)).toBeUndefined();
    expect(provider.generate).not.toHaveBeenCalled();
  });
});
