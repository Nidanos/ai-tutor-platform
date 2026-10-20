import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { exercises, exerciseSecrets, exerciseTests } from "../src/infrastructure/database/schema/index.js";
import type { SandboxProvider } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { verifyContent, verifyExercise } from "../src/modules/m6_exercises/services/verify-exercise.js";
import { createCourse, createSkill, exerciseRow } from "./helpers.js";

const EXPECTED = ["5", "9"];

// A fake sandbox: the code "REF" prints the expected output; "STARTER" and anything else print "wrong",
// unless the starter is told to pass too. "NOCOMPILE" doesn't compile.
const sandbox = (starterPasses = false) => {
  const run = vi.fn<SandboxProvider["run"]>(async ({ files }) => {
    const passes = files["solution.cpp"] === "REF" || (starterPasses && files["solution.cpp"] === "STARTER");
    if (files["solution.cpp"] === "NOCOMPILE") return { sandboxId: "fake", compile: { ok: false, output: "error" }, tests: [] };
    return {
      sandboxId: "fake",
      compile: { ok: true, output: "" },
      tests: EXPECTED.map((out) => ({ exitCode: 0, timedOut: false, timeMs: 1, peakMemoryKb: 1, stdout: passes ? out : "wrong", stderr: "" })),
    };
  });
  return { run };
};

async function draftExercise(rung = 3, reference = "REF") {
  const skill = await createSkill((await createCourse()).id);
  const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id, rung), starterCode: "STARTER" }).returning();
  await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "harness", referenceSolution: reference });
  await db.insert(exerciseTests).values(
    EXPECTED.map((expectedOutput, i) => ({
      exerciseId: exercise.id,
      seq: i + 1,
      name: `t${i + 1}`,
      size: "small" as const,
      visibility: "hidden" as const,
      expectedOutput,
    })),
  );
  return exercise;
}

const statusOf = async (id: string) => (await db.select().from(exercises).where(eq(exercises.id, id)))[0];

describe("exercise verification", () => {
  it("verifies when the reference passes and the starter fails", async () => {
    const exercise = await draftExercise();
    expect(await verifyExercise(exercise.id, sandbox())).toMatchObject({ ok: true });
    expect(await statusOf(exercise.id)).toMatchObject({ status: "verified", verifiedAt: expect.any(Date) });
  });

  it("rejects an exercise whose reference doesn't pass", async () => {
    const exercise = await draftExercise(3, "BROKEN");
    expect(await verifyExercise(exercise.id, sandbox())).toEqual({ ok: false, stage: "reference", reason: "the reference solution gets WA" });
    expect((await statusOf(exercise.id)).status).toBe("rejected");
  });

  it("rejects an exercise whose tests can't tell the starter from a solution", async () => {
    const exercise = await draftExercise();
    const result = await verifyExercise(exercise.id, sandbox(true));
    expect(result.ok).toBe(false);
    expect((await statusOf(exercise.id)).status).toBe("rejected");
  });

  it("runs only the program itself for rung 1 (there is no starter to try)", async () => {
    const exercise = await draftExercise(1);
    const provider = sandbox();
    expect(await verifyExercise(exercise.id, provider)).toMatchObject({ ok: true });
    expect(provider.run).toHaveBeenCalledTimes(1);
  });

  it("checks content before it is stored: a starter that won't compile, and wrong solutions that slip through", async () => {
    const content = { rung: 3, languageCode: "cpp", harnessCode: "h", referenceSolution: "REF", starterCode: "STARTER", tests: [{ seq: 1, expectedOutput: "5" }, { seq: 2, expectedOutput: "9" }], limits: { timeLimitMs: 1000, memoryLimitMb: 256 } };
    expect(await verifyContent({ ...content, wrongSolutions: ["WRONG1", "WRONG2"] }, sandbox())).toMatchObject({ ok: true });
    expect(await verifyContent({ ...content, starterCode: "NOCOMPILE" }, sandbox())).toMatchObject({ ok: false, stage: "compile" });
    expect(await verifyContent({ ...content, wrongSolutions: ["WRONG1", "REF"] }, sandbox())).toEqual({ ok: false, stage: "tests_too_weak", reason: "wrong solution 2 passes every test" });
    expect(await verifyContent({ ...content, wrongSolutions: ["NOCOMPILE"] }, sandbox())).toMatchObject({ ok: false, stage: "compile" });
  });
});

// Generated tests (ADR-0020): test 1 is small with a given output; 2 (medium) and 3 (large) are generated.
// Each fake solution prints its own readings; like the real sandbox, a run stops at a time-out.
const ran = (stdout: string, timeMs = 1) => ({ exitCode: 0, timedOut: false, timeMs, peakMemoryKb: 1, stdout, stderr: "" });
const timedOut = { exitCode: 124, timedOut: true, timeMs: 1000, peakMemoryKb: 1, stdout: "", stderr: "" };
const READINGS: Record<string, ReturnType<typeof ran>[]> = {
  REF: [ran("5"), ran("42\n"), ran("99")],
  SLOWREF: [ran("5"), ran("42"), ran("99", 500)],
  STARTER: [ran("wrong"), ran("wrong"), ran("wrong")],
  BRUTE: [ran("5"), ran("42"), timedOut],
  FAST: [ran("5"), ran("42"), ran("99")],
  DISAGREES: [ran("5"), ran("41"), timedOut],
  LAZY: [ran("5"), timedOut],
  BROKEN: [ran("6"), ran("42"), timedOut],
};
const generatedSandbox = (): SandboxProvider => ({
  run: async ({ files }) => ({ sandboxId: "fake", compile: { ok: true, output: "" }, tests: READINGS[files["solution.cpp"]] }),
});
const generated = {
  rung: 5,
  languageCode: "cpp",
  harnessCode: "h",
  referenceSolution: "REF",
  starterCode: "STARTER",
  bruteForceSolution: "BRUTE",
  tests: [{ seq: 1, expectedOutput: "5" }, { seq: 2, expectedOutput: null }, { seq: 3, expectedOutput: null }],
  limits: { timeLimitMs: 1000, memoryLimitMb: 256 },
};

describe("generated tests and the brute force", () => {
  it("takes generated tests' outputs from the reference when the brute force agrees and then times out", async () => {
    expect(await verifyContent(generated, generatedSandbox())).toEqual({ ok: true, expected: ["5", "42", "99"] });
  });

  it("rejects a brute force that is missing, never times out, disagrees, never agrees or fails a small test", async () => {
    const check = (bruteForceSolution: string | null) => verifyContent({ ...generated, bruteForceSolution }, generatedSandbox());
    expect(await check(null)).toMatchObject({ ok: false, stage: "brute_force" });
    expect(await check("FAST")).toMatchObject({ ok: false, stage: "tests_too_weak" });
    expect(await check("DISAGREES")).toEqual({ ok: false, stage: "brute_force", reason: "the brute force gets WA on generated test 2" });
    expect(await check("LAZY")).toEqual({ ok: false, stage: "brute_force", reason: "the brute force times out on every generated test, so none checks the reference" });
    expect(await check("BROKEN")).toEqual({ ok: false, stage: "brute_force", reason: "the brute force gets WA on test 1" });
  });

  it("rejects a reference that takes more than a third of the time limit", async () => {
    expect(await verifyContent({ ...generated, referenceSolution: "SLOWREF" }, generatedSandbox())).toEqual({
      ok: false,
      stage: "reference",
      reason: "the reference takes 500 ms, more than a third of the 1000 ms limit",
    });
  });

  it("stores the generated outputs when a draft is verified", async () => {
    const skill = await createSkill((await createCourse()).id);
    const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id, 5), starterCode: "STARTER", timeLimitMs: 1000 }).returning();
    await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "h", referenceSolution: "REF", bruteForceSolution: "BRUTE" });
    await db.insert(exerciseTests).values(
      generated.tests.map(({ seq, expectedOutput }) => ({ exerciseId: exercise.id, seq, name: `t${seq}`, size: expectedOutput === null ? ("large" as const) : ("small" as const), visibility: "hidden" as const, expectedOutput })),
    );
    expect(await verifyExercise(exercise.id, generatedSandbox())).toMatchObject({ ok: true });
    const stored = await db.select().from(exerciseTests).where(eq(exerciseTests.exerciseId, exercise.id)).orderBy(exerciseTests.seq);
    expect(stored.map((t) => t.expectedOutput)).toEqual(["5", "42", "99"]);
    expect((await statusOf(exercise.id)).status).toBe("verified");
  });
});
