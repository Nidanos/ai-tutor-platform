import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { getRunnableExercise } from "../../m6_exercises/services/exercises.service.js";
import * as repo from "../repositories/submissions.repository.js";
import { excerpt, judgeTest, overallVerdict, sameOutput, type Verdict } from "./judge.js";
import { TOOLCHAINS } from "./toolchains.js";

const CE_COUNTS_FROM = 3; // the 3rd compile error counts as an attempt and offers a hint (ADR-0004)

// The worker's job: run one submission and save its verdict (design §6.5).
// A sandbox failure is retried with a fresh sandbox; after the last try the verdict is SE.
export async function runSubmission(submissionId: string, isLastTry: boolean, provider: SandboxProvider = e2bProvider) {
  const found = await repo.findSubmissionForRun(submissionId);
  if (!found || found.submission.status === "completed") return; // gone, or a duplicate job
  const { submission, ceCount } = found;
  const exercise = await getRunnableExercise(submission.exerciseId);
  const answer = submission.answer ?? "";
  const base = { submissionId, attemptId: submission.attemptId, testsTotal: exercise.tests.length };
  await repo.setSubmissionStatus(submissionId, "running");

  // Rung 1 is "predict the output": the answer is text, so no code runs (ADR-0002).
  if (exercise.rung === 1) {
    const verdict = sameOutput(answer, exercise.tests[0]?.expectedOutput ?? "") ? "AC" : "WA";
    return repo.saveOutcome({ ...base, verdict, testsPassed: verdict === "AC" ? 1 : 0, countsAsAttempt: true, testResults: [] });
  }

  const toolchain = TOOLCHAINS[submission.languageCode as keyof typeof TOOLCHAINS];
  const runId = await repo.insertRun({
    purpose: "submission",
    submissionId,
    exerciseId: exercise.id,
    solutionKind: "learner",
    languageCode: submission.languageCode,
    toolchainVersion: toolchain.version,
  });

  let result;
  try {
    result = await provider.run({
      files: { [toolchain.solutionFile]: answer, [toolchain.harnessFile]: exercise.harnessCode ?? "" },
      compileCmd: toolchain.compileCmd,
      runCmd: toolchain.runCmd,
      tests: exercise.tests.map((t) => t.seq),
      limits: exercise,
    });
  } catch (err) {
    await repo.markRunFailed(runId, excerpt(String(err)));
    if (!isLastTry) {
      await repo.setSubmissionStatus(submissionId, "queued");
      throw err; // BullMQ tries again
    }
    return repo.saveOutcome({ ...base, verdict: "SE", testsPassed: 0, countsAsAttempt: false, testResults: [] });
  }

  const verdicts = result.tests.map((run, i) => judgeTest(run, exercise.tests[i].expectedOutput ?? "", exercise));
  const verdict: Verdict = result.compile.ok ? overallVerdict(verdicts) : "CE";
  await repo.saveOutcome({
    ...base,
    verdict,
    testsPassed: verdicts.filter((v) => v === "AC").length,
    countsAsAttempt: verdict !== "SE" && (verdict !== "CE" || ceCount + 1 >= CE_COUNTS_FROM),
    run: {
      id: runId,
      values: {
        e2bSandboxId: result.sandboxId,
        compileOutput: excerpt(result.compile.output),
        exitCode: result.tests.at(-1)?.exitCode,
        wallMs: result.tests.reduce((sum, t) => sum + t.timeMs, 0),
        peakMemoryKb: Math.max(0, ...result.tests.map((t) => t.peakMemoryKb)),
      },
    },
    testResults: result.tests.map((run, i) => ({
      runId,
      testId: exercise.tests[i].id,
      verdict: verdicts[i],
      timeMs: run.timeMs,
      memoryKb: run.peakMemoryKb,
      stdoutExcerpt: excerpt(run.stdout),
      stderrExcerpt: excerpt(run.stderr),
    })),
  });
}
