import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db, type Tx } from "../../../infrastructure/database/index.js";
import {
  exerciseAttempts,
  runTestResults,
  sandboxRuns,
  submissions,
} from "../../../infrastructure/database/schema/index.js";
import type { Verdict } from "../services/judge.js";

export const findOwnAttempt = async (attemptId: string, userId: string) =>
  (
    await db
      .select({ id: exerciseAttempts.id, status: exerciseAttempts.status, exerciseId: exerciseAttempts.exerciseId })
      .from(exerciseAttempts)
      .where(and(eq(exerciseAttempts.id, attemptId), eq(exerciseAttempts.userId, userId)))
  )[0];

const submissionRef = {
  id: submissions.id,
  userId: submissions.userId,
  attemptId: submissions.attemptId,
  exerciseId: submissions.exerciseId,
  status: submissions.status,
};

export const findByIdempotencyKey = async (idempotencyKey: string) =>
  (await db.select(submissionRef).from(submissions).where(eq(submissions.idempotencyKey, idempotencyKey)))[0];

// One row per idempotency key: a repeated request gets the first submission back, counted once.
export const createSubmission = (values: typeof submissions.$inferInsert) =>
  db.transaction(async (tx) => {
    const [created] = await tx.insert(submissions).values(values).onConflictDoNothing().returning(submissionRef);
    if (created) {
      await tx
        .update(exerciseAttempts)
        .set({ submissionCount: sql`${exerciseAttempts.submissionCount} + 1` })
        .where(eq(exerciseAttempts.id, values.attemptId));
      return created;
    }
    return (await tx.select(submissionRef).from(submissions).where(eq(submissions.idempotencyKey, values.idempotencyKey)))[0];
  });

export const findOwnSubmission = async (id: string, userId: string) =>
  (await db.select().from(submissions).where(and(eq(submissions.id, id), eq(submissions.userId, userId))))[0];

export const findSubmissionForRun = async (id: string) =>
  (
    await db
      .select({
        submission: submissions,
        attempt: {
          context: exerciseAttempts.context,
          ceCount: exerciseAttempts.ceCount,
          hintLevel: exerciseAttempts.hintLevel,
          activeMs: exerciseAttempts.activeMs,
        },
      })
      .from(submissions)
      .innerJoin(exerciseAttempts, eq(exerciseAttempts.id, submissions.attemptId))
      .where(eq(submissions.id, id))
  )[0];

// Was a WA/RE already penalised in this attempt? Debugging by trial is penalised once (ADR-0004).
export const hasPenalisedFailure = async (attemptId: string, exceptSubmissionId: string) =>
  (
    await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.attemptId, attemptId),
          ne(submissions.id, exceptSubmissionId),
          eq(submissions.countsAsAttempt, true),
          inArray(submissions.verdict, ["WA", "RE"]),
        ),
      )
      .limit(1)
  ).length > 0;

export const setSubmissionStatus = (id: string, status: "queued" | "running") =>
  db.update(submissions).set({ status }).where(eq(submissions.id, id));

export const insertRun = async (values: typeof sandboxRuns.$inferInsert) =>
  (await db.insert(sandboxRuns).values({ ...values, status: "running", startedAt: new Date() }).returning({ id: sandboxRuns.id }))[0].id;

export const markRunFailed = (runId: string, errorMessage: string) =>
  db
    .update(sandboxRuns)
    .set({ status: "sandbox_error", errorMessage, finishedAt: new Date() })
    .where(eq(sandboxRuns.id, runId));

export type Outcome = {
  submissionId: string;
  attemptId: string;
  verdict: Verdict;
  testsPassed: number;
  testsTotal: number;
  countsAsAttempt: boolean;
  run?: { id: string; values: Partial<typeof sandboxRuns.$inferInsert> };
  testResults: (typeof runTestResults.$inferInsert)[];
};

// The verdict and everything behind it are saved together or not at all; afterSave lets
// another module (M4 mastery) write in the same transaction.
export const saveOutcome = (o: Outcome, afterSave?: (tx: Tx) => Promise<void>) =>
  db.transaction(async (tx) => {
    const now = new Date();
    if (o.run) {
      await tx
        .update(sandboxRuns)
        .set({ ...o.run.values, status: "completed", verdict: o.verdict, finishedAt: now })
        .where(eq(sandboxRuns.id, o.run.id));
    }
    if (o.testResults.length) await tx.insert(runTestResults).values(o.testResults);
    await tx
      .update(submissions)
      .set({
        status: "completed",
        verdict: o.verdict,
        testsPassed: o.testsPassed,
        testsTotal: o.testsTotal,
        countsAsAttempt: o.countsAsAttempt,
        completedAt: now,
      })
      .where(eq(submissions.id, o.submissionId));
    await tx
      .update(exerciseAttempts)
      .set({
        updatedAt: now,
        ...(o.verdict === "CE" && { ceCount: sql`${exerciseAttempts.ceCount} + 1` }),
        ...(o.verdict === "AC" && { status: "solved" as const, solvedAt: now }),
      })
      .where(eq(exerciseAttempts.id, o.attemptId));
    await afterSave?.(tx);
  });

// The latest run of a submission (an earlier one may have hit a sandbox error), with its test results.
export async function findLatestRun(submissionId: string) {
  const [run] = await db
    .select({ id: sandboxRuns.id, compileOutput: sandboxRuns.compileOutput })
    .from(sandboxRuns)
    .where(eq(sandboxRuns.submissionId, submissionId))
    .orderBy(desc(sandboxRuns.createdAt))
    .limit(1);
  if (!run) return undefined;
  const results = await db.select().from(runTestResults).where(eq(runTestResults.runId, run.id));
  return { ...run, results };
}
