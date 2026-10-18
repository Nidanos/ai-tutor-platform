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
    expect(await verifyExercise(exercise.id, sandbox())).toEqual({ ok: true });
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
    expect(await verifyExercise(exercise.id, provider)).toEqual({ ok: true });
    expect(provider.run).toHaveBeenCalledTimes(1);
  });

  it("checks content before it is stored: a starter that won't compile, and wrong solutions that slip through", async () => {
    const content = { rung: 3, languageCode: "cpp", harnessCode: "h", referenceSolution: "REF", starterCode: "STARTER", tests: [{ seq: 1, expectedOutput: "5" }, { seq: 2, expectedOutput: "9" }], limits: { timeLimitMs: 1000, memoryLimitMb: 256 } };
    expect(await verifyContent({ ...content, wrongSolutions: ["WRONG1", "WRONG2"] }, sandbox())).toEqual({ ok: true });
    expect(await verifyContent({ ...content, starterCode: "NOCOMPILE" }, sandbox())).toMatchObject({ ok: false, stage: "compile" });
    expect(await verifyContent({ ...content, wrongSolutions: ["WRONG1", "REF"] }, sandbox())).toEqual({ ok: false, stage: "tests_too_weak", reason: "wrong solution 2 passes every test" });
    expect(await verifyContent({ ...content, wrongSolutions: ["NOCOMPILE"] }, sandbox())).toMatchObject({ ok: false, stage: "compile" });
  });
});
