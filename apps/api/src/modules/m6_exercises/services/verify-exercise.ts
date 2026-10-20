import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { Limits, RunResult, SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { judgeTest, overallVerdict, type Verdict } from "../../m7_execution/services/judge.js";
import { TOOLCHAINS } from "../../m7_execution/services/toolchains.js";
import * as repo from "../repositories/exercises.repository.js";

// What verification needs, whether the exercise is stored yet or not.
export type Content = {
  rung: number;
  languageCode: string;
  harnessCode: string | null;
  referenceSolution: string;
  starterCode: string;
  tests: { seq: number; expectedOutput: string | null }[]; // null: a generated test, expected from the reference
  limits: Limits;
  wrongSolutions?: string[]; // generated exercises: common mistakes the tests must catch (ADR-0016)
  bruteForceSolution?: string | null; // needed when there are generated tests (ADR-0020)
};
type Stage = "compile" | "reference" | "brute_force" | "tests_too_weak";
// On success, every test's expected output: the given ones, and the reference's for generated tests.
export type Verification = { ok: true; expected: string[] } | { ok: false; stage: Stage; reason: string };

const fail = (stage: Stage, reason: string): Verification => ({ ok: false, stage, reason });

// ADR-0004, ADR-0016 and ADR-0020: in the real sandbox, the reference passes every test, the starter
// compiles but fails one, every wrong solution compiles but fails one, and a brute force tells fast
// from slow on generated tests. Rung 1 has no starter: the program itself must print the expected output.
export async function verifyContent(content: Content, provider: SandboxProvider = e2bProvider): Promise<Verification> {
  const reference = await run(content, content.referenceSolution, provider);
  const expected = content.tests.map((t, i) => t.expectedOutput ?? reference.tests[i]?.stdout.trimEnd() ?? "");
  const verdict = verdictOf(content, reference, expected);
  if (verdict !== "AC") return fail(verdict === "CE" ? "compile" : "reference", `the reference solution gets ${verdict}`);
  const generated = content.tests.some((t) => t.expectedOutput === null);
  const slowest = Math.max(...reference.tests.map((t) => t.timeMs));
  if (generated && slowest * 3 > content.limits.timeLimitMs)
    return fail("reference", `the reference takes ${slowest} ms, more than a third of the ${content.limits.timeLimitMs} ms limit`);
  if (content.rung === 1) return { ok: true, expected };

  const starter = verdictOf(content, await run(content, content.starterCode, provider), expected);
  if (starter === "CE") return fail("compile", "the starter code doesn't compile");
  if (starter === "AC") return fail("tests_too_weak", "the starter code already passes, so the tests can't tell it from a solution");
  for (const [i, wrong] of (content.wrongSolutions ?? []).entries()) {
    const verdict = verdictOf(content, await run(content, wrong, provider), expected);
    if (verdict === "CE") return fail("compile", `wrong solution ${i + 1} doesn't compile, so it proves nothing`);
    if (verdict === "AC") return fail("tests_too_weak", `wrong solution ${i + 1} passes every test`);
  }
  if (generated) {
    const problem = await bruteForceProblem(content, expected, provider);
    if (problem) return problem;
  }
  return { ok: true, expected };
}

// The brute force must pass the small tests, agree with the reference on at least one generated test,
// and then time out: proof that the reference is right on generated data and that the large tests need speed.
async function bruteForceProblem(content: Content, expected: string[], provider: SandboxProvider) {
  if (!content.bruteForceSolution) return fail("brute_force", "generated tests need a brute force to check the reference against");
  const result = await run(content, content.bruteForceSolution, provider);
  if (!result.compile.ok) return fail("compile", "the brute force doesn't compile");
  let agreed = 0;
  for (const [i, testRun] of result.tests.entries()) {
    const verdict = judgeTest(testRun, expected[i], content.limits);
    const { seq, expectedOutput } = content.tests[i];
    if (expectedOutput !== null && verdict !== "AC") return fail("brute_force", `the brute force gets ${verdict} on test ${seq}`);
    if (expectedOutput === null && verdict === "TLE")
      return agreed ? undefined : fail("brute_force", "the brute force times out on every generated test, so none checks the reference");
    if (expectedOutput === null && verdict !== "AC") return fail("brute_force", `the brute force gets ${verdict} on generated test ${seq}`);
    if (expectedOutput === null) agreed++;
  }
  return fail("tests_too_weak", "the brute force finishes every generated test in time, so the tests can't tell fast from slow");
}

// `pnpm exercises:verify`: checks a stored draft, fills in generated tests' outputs, and marks it verified or rejected.
export async function verifyExercise(id: string, provider: SandboxProvider = e2bProvider): Promise<Verification> {
  const exercise = await repo.findForVerification(id);
  if (!exercise) throw new AppError(404, "EXERCISE_NOT_FOUND", "No such exercise");
  const result = await verifyContent({ ...exercise, limits: exercise }, provider);
  if (result.ok) {
    const generated = exercise.tests.flatMap((t, i) => (t.expectedOutput === null ? [{ seq: t.seq, expectedOutput: result.expected[i] }] : []));
    await repo.fillExpectedOutputs(id, generated);
  }
  await repo.setStatus(id, result.ok ? "verified" : "rejected");
  return result;
}

function run(content: Content, solution: string, provider: SandboxProvider): Promise<RunResult> {
  const toolchain = TOOLCHAINS[content.languageCode as keyof typeof TOOLCHAINS];
  const harness = content.harnessCode ?? `#include "${toolchain.solutionFile}"\n`; // rung 1: run the program as is
  return provider.run({
    files: { [toolchain.solutionFile]: solution, [toolchain.harnessFile]: harness },
    compileCmd: toolchain.compileCmd,
    runCmd: toolchain.runCmd,
    tests: content.tests.map((t) => t.seq),
    limits: content.limits,
  });
}

const verdictOf = (content: Content, result: RunResult, expected: string[]): Verdict =>
  result.compile.ok ? overallVerdict(result.tests.map((testRun, i) => judgeTest(testRun, expected[i], content.limits))) : "CE";
