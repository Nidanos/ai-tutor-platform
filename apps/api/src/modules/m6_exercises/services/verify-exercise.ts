import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { Limits, SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
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
  tests: { seq: number; expectedOutput: string | null }[];
  limits: Limits;
  wrongSolutions?: string[]; // generated exercises: common mistakes the tests must catch (ADR-0016)
};
export type Verification = { ok: true } | { ok: false; stage: "compile" | "reference" | "tests_too_weak"; reason: string };

const fail = (stage: "compile" | "reference" | "tests_too_weak", reason: string): Verification => ({ ok: false, stage, reason });

// ADR-0004 and ADR-0016: in the real sandbox, the reference passes every test, the starter compiles but
// fails one, and every wrong solution compiles but fails one: proof the tests tell a solution from a
// non-solution. Rung 1 has no starter: the program itself must print the expected output.
export async function verifyContent(content: Content, provider: SandboxProvider = e2bProvider): Promise<Verification> {
  const reference = await judge(content, content.referenceSolution, provider);
  if (reference !== "AC") return fail(reference === "CE" ? "compile" : "reference", `the reference solution gets ${reference}`);
  if (content.rung === 1) return { ok: true };

  const starter = await judge(content, content.starterCode, provider);
  if (starter === "CE") return fail("compile", "the starter code doesn't compile");
  if (starter === "AC") return fail("tests_too_weak", "the starter code already passes, so the tests can't tell it from a solution");
  for (const [i, wrong] of (content.wrongSolutions ?? []).entries()) {
    const verdict = await judge(content, wrong, provider);
    if (verdict === "CE") return fail("compile", `wrong solution ${i + 1} doesn't compile, so it proves nothing`);
    if (verdict === "AC") return fail("tests_too_weak", `wrong solution ${i + 1} passes every test`);
  }
  return { ok: true };
}

// `pnpm exercises:verify`: checks a stored draft and marks it verified or rejected.
export async function verifyExercise(id: string, provider: SandboxProvider = e2bProvider): Promise<Verification> {
  const exercise = await repo.findForVerification(id);
  if (!exercise) throw new AppError(404, "EXERCISE_NOT_FOUND", "No such exercise");
  const result = await verifyContent({ ...exercise, limits: exercise }, provider);
  await repo.setStatus(id, result.ok ? "verified" : "rejected");
  return result;
}

async function judge(content: Content, solution: string, provider: SandboxProvider): Promise<Verdict> {
  const toolchain = TOOLCHAINS[content.languageCode as keyof typeof TOOLCHAINS];
  const harness = content.harnessCode ?? `#include "${toolchain.solutionFile}"\n`; // rung 1: run the program as is
  const result = await provider.run({
    files: { [toolchain.solutionFile]: solution, [toolchain.harnessFile]: harness },
    compileCmd: toolchain.compileCmd,
    runCmd: toolchain.runCmd,
    tests: content.tests.map((t) => t.seq),
    limits: content.limits,
  });
  if (!result.compile.ok) return "CE";
  return overallVerdict(result.tests.map((run, i) => judgeTest(run, content.tests[i].expectedOutput ?? "", content.limits)));
}
