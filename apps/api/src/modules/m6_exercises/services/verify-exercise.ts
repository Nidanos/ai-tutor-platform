import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { judgeTest, overallVerdict, type Verdict } from "../../m7_execution/services/judge.js";
import { TOOLCHAINS } from "../../m7_execution/services/toolchains.js";
import * as repo from "../repositories/exercises.repository.js";

type Exercise = NonNullable<Awaited<ReturnType<typeof repo.findForVerification>>>;
export type Verification = { ok: true } | { ok: false; reason: string };

// ADR-0004: an exercise is served only if, in the real sandbox, its reference passes every test
// and its starter code fails at least one, which proves the tests can tell a solution from a
// non-solution. Rung 1 has no starter to run: the program itself must print the expected output.
export async function verifyExercise(id: string, provider: SandboxProvider = e2bProvider): Promise<Verification> {
  const exercise = await repo.findForVerification(id);
  if (!exercise) throw new AppError(404, "EXERCISE_NOT_FOUND", "No such exercise");

  const reference = await judge(exercise, exercise.referenceSolution, provider);
  if (reference !== "AC") return reject(id, `the reference solution gets ${reference}`);
  if (exercise.rung > 1 && (await judge(exercise, exercise.starterCode, provider)) === "AC") {
    return reject(id, "the starter code already passes, so the tests can't tell it from a solution");
  }
  await repo.setStatus(id, "verified");
  return { ok: true };
}

async function reject(id: string, reason: string): Promise<Verification> {
  await repo.setStatus(id, "rejected");
  return { ok: false, reason };
}

async function judge(exercise: Exercise, solution: string, provider: SandboxProvider): Promise<Verdict> {
  const toolchain = TOOLCHAINS[exercise.languageCode as keyof typeof TOOLCHAINS];
  const harness = exercise.harnessCode ?? `#include "${toolchain.solutionFile}"\n`; // rung 1: run the program as is
  const result = await provider.run({
    files: { [toolchain.solutionFile]: solution, [toolchain.harnessFile]: harness },
    compileCmd: toolchain.compileCmd,
    runCmd: toolchain.runCmd,
    tests: exercise.tests.map((t) => t.seq),
    limits: exercise,
  });
  if (!result.compile.ok) return "CE";
  return overallVerdict(result.tests.map((run, i) => judgeTest(run, exercise.tests[i].expectedOutput ?? "", exercise)));
}
