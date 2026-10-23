import { enqueueSubmission } from "../../../infrastructure/queue/submissions-queue.js";
import { sha256 } from "../../../shared/auth/tokens.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { getExercise, getRunnableExercise } from "../../m6_exercises/services/exercises.service.js";
import { findLatestAttempt, insertAttempt } from "../repositories/attempts.repository.js";
import * as repo from "../repositories/submissions.repository.js";
import type { SubmissionInput } from "../schemas/submissions.schemas.js";
import { runSubmission } from "./run-submission.js";

// Saves the submission and queues it; the verdict comes later via getResult (202 + polling).
// Rung 1 compares text and needs no sandbox, so a new one is graded here: a predicted output shouldn't
// wait behind other learners' code runs. A repeat of it, or a failure here, goes to the queue instead.
export async function submit(userId: string, { attemptId, answer, idempotencyKey }: SubmissionInput) {
  const attempt = await repo.findOwnAttempt(attemptId, userId);
  if (!attempt) throw new AppError(404, "ATTEMPT_NOT_FOUND", "No such attempt");
  if (attempt.status !== "active") {
    // A retried request whose answer just solved the attempt gets that answer's submission back.
    const earlier = await repo.findByIdempotencyKey(idempotencyKey);
    if (earlier?.attemptId === attemptId) return { submissionId: earlier.id, status: earlier.status };
    throw new AppError(409, "ATTEMPT_CLOSED", "This attempt is already finished");
  }

  const { languageCode, rung } = await getExercise(attempt.exerciseId);
  const saved = await repo.createSubmission({
    attemptId,
    userId,
    exerciseId: attempt.exerciseId,
    languageCode,
    answer,
    answerSha256: sha256(answer),
    idempotencyKey,
  });
  // A key only ever returns its own submission: never another learner's, nor another attempt's.
  if (saved.userId !== userId || saved.attemptId !== attemptId) throw new AppError(409, "IDEMPOTENCY_KEY_REUSED", "Send a new idempotency key");
  if (saved.status === "completed") return { submissionId: saved.id, status: saved.status };
  if (rung === 1 && saved.isNew) {
    const graded = await runSubmission(saved.id, true)
      .then(() => true)
      .catch((err) => {
        console.error(`Grading rung-1 submission ${saved.id} failed; queueing it`, err);
        return false;
      });
    if (graded) return { submissionId: saved.id, status: "completed" as const };
  }
  // Also on a repeat: if the first enqueue failed, this one heals it (the job id prevents doubles).
  await enqueueSubmission(saved.id);
  return { submissionId: saved.id, status: saved.status };
}

// For M3: a placement-test code task runs like any submission, in a 'diagnostic' attempt with no hints
// and no evidence (ADR-0004). An attempt an earlier diagnostic left open on this exercise is reused.
// A retried answer gets its first submission back, but only one made on this same exercise.
export async function submitDiagnostic(userId: string, enrollmentId: string, exerciseId: string, answer: string, idempotencyKey: string) {
  const earlier = await repo.findByIdempotencyKey(idempotencyKey);
  if (earlier?.userId === userId && earlier.exerciseId === exerciseId) {
    if (earlier.status !== "completed") await enqueueSubmission(earlier.id); // heals a failed first enqueue, as submit() does
    return { submissionId: earlier.id, status: earlier.status };
  }
  await insertAttempt({ userId, enrollmentId, exerciseId, context: "diagnostic", hintCeiling: 0 });
  const attempt = (await findLatestAttempt(userId, exerciseId))!;
  return submit(userId, { attemptId: attempt.id, answer, idempotencyKey });
}

// Sample tests show input, expected and actual output; hidden tests show only their verdict.
export async function getResult(userId: string, submissionId: string) {
  const submission = await repo.findOwnSubmission(submissionId, userId);
  if (!submission) throw new AppError(404, "SUBMISSION_NOT_FOUND", "No such submission");
  if (submission.status !== "completed") return { submissionId, status: submission.status };

  const [run, { tests }] = await Promise.all([
    repo.findLatestRun(submissionId),
    getRunnableExercise(submission.exerciseId),
  ]);
  const resultOf = new Map(run?.results.map((r) => [r.testId, r]));
  return {
    submissionId,
    status: submission.status,
    verdict: submission.verdict,
    testsPassed: submission.testsPassed,
    testsTotal: submission.testsTotal,
    compileOutput: submission.verdict === "CE" ? run?.compileOutput : undefined,
    tests: tests.flatMap((test) => {
      const result = resultOf.get(test.id);
      if (!result) return []; // not run: an earlier test already failed
      const shown = { seq: test.seq, name: test.name, visibility: test.visibility, verdict: result.verdict, timeMs: result.timeMs };
      if (test.visibility === "hidden") return [shown];
      return [{ ...shown, input: test.input, expectedOutput: test.expectedOutput, output: result.stdoutExcerpt }];
    }),
  };
}

// For M13: submissions by verdict, learners who ran code, median run time.
export const runStats = repo.runStats;

// For M8: the result of the learner's last graded run on this attempt, if any.
export async function lastResult(userId: string, attemptId: string) {
  const id = await repo.findLatestSubmissionId(attemptId);
  return id ? getResult(userId, id) : undefined;
}

// For M1: the learner's own attempts and code (DPDP access), and their erasure.
export const learnerPractice = repo.learnerPractice;
export const erasePractice = repo.erasePractice;

// For M8: what the learner's latest runs on a skill said, for the lesson note.
export const recentResults = repo.recentResults;
