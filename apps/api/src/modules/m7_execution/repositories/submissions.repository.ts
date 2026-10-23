import { and, count, countDistinct, desc, eq, gte, inArray, isNotNull, ne, type SQL, sql } from "drizzle-orm";
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
      return { ...created, isNew: true };
    }
    const [earlier] = await tx.select(submissionRef).from(submissions).where(eq(submissions.idempotencyKey, values.idempotencyKey));
    return { ...earlier, isNew: false };
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

// Has the learner had a counted try at this exercise before, in any attempt? Run after M4 locks the
// skill's mastery row, so of two tries graded at once only the first finds none (ADR-0021).
export const hasEarlierCountedTry = async (tx: Tx, userId: string, exerciseId: string, exceptSubmissionId: string) =>
  (
    await tx
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.exerciseId, exerciseId),
          ne(submissions.id, exceptSubmissionId),
          eq(submissions.countsAsAttempt, true),
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

// For M13: how code runs went in the window. The median run time is over learner runs that finished.
export async function runStats(since: Date) {
  const inWindow = gte(submissions.createdAt, since);
  const [totals] = await db.select({ submissions: count(), learners: countDistinct(submissions.userId) }).from(submissions).where(inWindow);
  const byVerdict = await db.select({ verdict: submissions.verdict, n: count() }).from(submissions).where(inWindow).groupBy(submissions.verdict);
  const [timing] = await db
    .select({ medianMs: sql<string | null>`percentile_cont(0.5) within group (order by ${sandboxRuns.wallMs})` })
    .from(sandboxRuns)
    .where(and(eq(sandboxRuns.purpose, "submission"), eq(sandboxRuns.status, "completed"), gte(sandboxRuns.finishedAt, since)));
  return { ...totals, byVerdict, medianRunMs: timing.medianMs === null ? null : Math.round(Number(timing.medianMs)) };
}

export const findLatestSubmissionId = async (attemptId: string) =>
  (
    await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.attemptId, attemptId), eq(submissions.status, "completed")))
      .orderBy(desc(submissions.createdAt))
      .limit(1)
  )[0]?.id;

// For M1 (DPDP access): every attempt and submission, code included.
export async function learnerPractice(userId: string) {
  const [attempts, submitted] = await Promise.all([
    db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId)),
    db.select().from(submissions).where(eq(submissions.userId, userId)),
  ]);
  return { attempts, submissions: submitted };
}

const submissionsWhere = (where: SQL) => db.select({ id: submissions.id }).from(submissions).where(where);
const runsWhere = (where: SQL) => db.select({ id: sandboxRuns.id }).from(sandboxRuns).where(inArray(sandboxRuns.submissionId, submissionsWhere(where)));

// The code itself: the verdict, the counts and the code's hash stay.
const deleteCode = (where: SQL) =>
  db.update(submissions).set({ answer: null, answerPurgedAt: new Date() }).where(and(where, isNotNull(submissions.answer)));

// Compiler and error messages quote source lines; program output only with `andOutput`.
async function deleteRunText(where: SQL, andOutput = false) {
  await db.update(sandboxRuns).set({ compileOutput: null }).where(inArray(sandboxRuns.id, runsWhere(where)));
  await db
    .update(runTestResults)
    .set({ stderrExcerpt: null, ...(andOutput && { stdoutExcerpt: null }) })
    .where(inArray(runTestResults.runId, runsWhere(where)));
}

// Privacy policy §2: a cleared skill's code, and the text that can quote it. Graded submissions only: one
// still queued (another tab) needs its code to run. The one just graded keeps its compiler message, so its
// result can still be read; that goes with the skill's next graded submission.
export async function purgeSkillCode(userId: string, exerciseIds: string[], justGradedId: string) {
  const graded = and(eq(submissions.userId, userId), inArray(submissions.exerciseId, exerciseIds), eq(submissions.status, "completed"))!;
  await deleteCode(graded);
  await deleteRunText(and(graded, ne(submissions.id, justGradedId))!);
}

// For M1 (DPDP erasure). Code goes, and everything printed from it. Verdicts, counts and timings stay
// only for learners who opted in to research or training.
export async function erasePractice(userId: string, keepNumbers: boolean) {
  const theirs = eq(submissions.userId, userId);
  if (keepNumbers) {
    await deleteCode(theirs);
    await deleteRunText(theirs, true);
    return;
  }
  await db.delete(sandboxRuns).where(inArray(sandboxRuns.submissionId, submissionsWhere(theirs))); // their test results go with them
  await db.delete(submissions).where(eq(submissions.userId, userId));
  await db.delete(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
}

// For M8's lesson note: the learner's latest graded results on these exercises. Verdicts and counts, never code.
export const recentResults = (userId: string, exerciseIds: string[], limit: number) =>
  db
    .select({ verdict: submissions.verdict, testsPassed: submissions.testsPassed, testsTotal: submissions.testsTotal })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), inArray(submissions.exerciseId, exerciseIds), eq(submissions.status, "completed")))
    .orderBy(desc(submissions.createdAt))
    .limit(limit);
