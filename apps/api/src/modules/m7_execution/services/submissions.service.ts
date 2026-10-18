import { enqueueSubmission } from "../../../infrastructure/queue/submissions-queue.js";
import { sha256 } from "../../../shared/auth/tokens.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { getExercise, getRunnableExercise } from "../../m6_exercises/services/exercises.service.js";
import { findLatestAttempt, insertAttempt } from "../repositories/attempts.repository.js";
import * as repo from "../repositories/submissions.repository.js";
import type { SubmissionInput } from "../schemas/submissions.schemas.js";

// Saves the submission and queues it; the verdict comes later via getResult (202 + polling).
export async function submit(userId: string, { attemptId, answer, idempotencyKey }: SubmissionInput) {
  const attempt = await repo.findOwnAttempt(attemptId, userId);
  if (!attempt) throw new AppError(404, "ATTEMPT_NOT_FOUND", "No such attempt");
  if (attempt.status !== "active") throw new AppError(409, "ATTEMPT_CLOSED", "This attempt is already finished");

  const { languageCode } = await getExercise(attempt.exerciseId);
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
  // Also on a repeat: if the first enqueue failed, this one heals it (the job id prevents doubles).
  if (saved.status !== "completed") await enqueueSubmission(saved.id);
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
