import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { isCleared } from "../../m4_mastery/services/mastery-read.service.js";
import { recordEvidence } from "../../m4_mastery/services/mastery.service.js";
import { exerciseIdsOfSkill, getRunnableExercise } from "../../m6_exercises/services/exercises.service.js";
import { advanceOnSolve } from "../../m12_scaffolding/services/scaffolding.service.js";
import * as repo from "../repositories/submissions.repository.js";
import { excerpt, judgeTest, overallVerdict, sameOutput, type Verdict } from "./judge.js";
import { TOOLCHAINS } from "./toolchains.js";

const CE_COUNTS_FROM = 3; // the 3rd compile error counts as an attempt and offers a hint (ADR-0004)
// Practice and review move mastery. The diagnostic seeds it once; holdout calibrates first (design §5.9).
const EVIDENCE_CONTEXTS = new Set(["practice", "review"]);

type Finish = Omit<repo.Outcome, "submissionId" | "attemptId" | "testsTotal">;

// The worker's job: run one submission, save its verdict and its mastery evidence (design §6.5).
// A sandbox failure is retried with a fresh sandbox; after the last try the verdict is SE.
export async function runSubmission(submissionId: string, isLastTry: boolean, provider: SandboxProvider = e2bProvider) {
  const found = await repo.findSubmissionForRun(submissionId);
  if (!found) return; // gone
  const { submission, attempt } = found;
  const exercise = await getRunnableExercise(submission.exerciseId);
  // A duplicate job, or BullMQ retrying a purge that failed after the verdict was saved.
  if (submission.status === "completed") return purgeIfCleared(submission.userId, exercise.skillId, submission.languageCode, submissionId);
  const answer = submission.answer ?? "";
  await repo.setSubmissionStatus(submissionId, "running");

  // Verdict, run details, mastery change and fade advance are saved in one transaction (design §6.5).
  const finish = async (outcome: Finish) => {
    const evidence =
      outcome.countsAsAttempt && EVIDENCE_CONTEXTS.has(attempt.context)
        ? {
            userId: submission.userId,
            skillId: exercise.skillId,
            languageCode: submission.languageCode,
            submissionId,
            verdict: outcome.verdict,
            rung: exercise.rung,
            hintsUsed: attempt.hintLevel,
            activeMs: attempt.activeMs,
            isRepeatFailure: await repo.hasPenalisedFailure(submission.attemptId, submissionId),
          }
        : undefined;
    const outcomeRow = { ...outcome, submissionId, attemptId: submission.attemptId, testsTotal: exercise.tests.length };
    await repo.saveOutcome(
      outcomeRow,
      evidence &&
        (async (tx) => {
          await recordEvidence(tx, evidence);
          const { userId, skillId, languageCode, rung, hintsUsed } = evidence;
          if (evidence.verdict === "AC") await advanceOnSolve(tx, { userId, skillId, languageCode, rung, hintsUsed, submissionId });
        }),
    );
    await purgeIfCleared(submission.userId, exercise.skillId, submission.languageCode, submissionId);
  };

  // Rung 1 is "predict the output": the answer is text, so no code runs (ADR-0002).
  if (exercise.rung === 1) {
    const verdict = sameOutput(answer, exercise.tests[0]?.expectedOutput ?? "") ? "AC" : "WA";
    return finish({ verdict, testsPassed: verdict === "AC" ? 1 : 0, countsAsAttempt: true, testResults: [] });
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
    return finish({ verdict: "SE", testsPassed: 0, countsAsAttempt: false, testResults: [] });
  }

  const verdicts = result.tests.map((run, i) => judgeTest(run, exercise.tests[i].expectedOutput ?? "", exercise));
  const verdict: Verdict = result.compile.ok ? overallVerdict(verdicts) : "CE";
  await finish({
    verdict,
    testsPassed: verdicts.filter((v) => v === "AC").length,
    countsAsAttempt: verdict !== "SE" && (verdict !== "CE" || attempt.ceCount + 1 >= CE_COUNTS_FROM),
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

// Privacy policy §2: code is kept only until the learner clears its skill. Checked after every graded
// submission, so the clearing one, every one before it and any later practice all go.
async function purgeIfCleared(userId: string, skillId: string, languageCode: string, justGradedId: string) {
  if (await isCleared({ userId, skillId, languageCode })) {
    await repo.purgeSkillCode(userId, await exerciseIdsOfSkill(skillId, languageCode), justGradedId);
  }
}
