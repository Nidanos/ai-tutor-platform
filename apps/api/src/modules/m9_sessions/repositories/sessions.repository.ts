import { and, count, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { sumOf } from "../../../infrastructure/database/aggregates.js";
import { db } from "../../../infrastructure/database/index.js";
import { learningSessions, sessionSteps } from "../../../infrastructure/database/schema/index.js";

export type Session = typeof learningSessions.$inferSelect;
export type Step = typeof sessionSteps.$inferSelect;

export const findOwn = async (id: string, userId: string) =>
  (await db.select().from(learningSessions).where(and(eq(learningSessions.id, id), eq(learningSessions.userId, userId))))[0];

// At most one session per learner is not ended (partial unique index).
export const findOpen = async (userId: string) =>
  (await db.select().from(learningSessions).where(and(eq(learningSessions.userId, userId), ne(learningSessions.status, "ended"))))[0];

// Two tabs starting at once get the same session.
export async function createSession(userId: string, enrollmentId: string) {
  await db.insert(learningSessions).values({ userId, enrollmentId }).onConflictDoNothing();
  return (await findOpen(userId))!;
}

export const updateSession = async (id: string, values: Partial<Session>) =>
  (await db.update(learningSessions).set(values).where(eq(learningSessions.id, id)).returning())[0];

// The current step is the session's one active step (FR-M9-03: resume continues there).
export const findActiveStep = async (sessionId: string) =>
  (await db.select().from(sessionSteps).where(and(eq(sessionSteps.sessionId, sessionId), eq(sessionSteps.status, "active"))))[0];

export const completeStep = (id: string) =>
  db.update(sessionSteps).set({ status: "completed", completedAt: new Date() }).where(and(eq(sessionSteps.id, id), eq(sessionSteps.status, "active")));

// Appends the next step as the active one. Two requests racing lose on seq or on "one active", and
// both read back the same step.
export async function addStep(sessionId: string, values: Pick<Step, "kind" | "recommendationId" | "exerciseId">) {
  const [last] = await db.select({ seq: sessionSteps.seq }).from(sessionSteps).where(eq(sessionSteps.sessionId, sessionId)).orderBy(desc(sessionSteps.seq)).limit(1);
  await db
    .insert(sessionSteps)
    .values({ sessionId, seq: (last?.seq ?? 0) + 1, status: "active", startedAt: new Date(), ...values })
    .onConflictDoNothing();
  return findActiveStep(sessionId);
}

export const sessionStats = async (since: Date) =>
  (
    await db
      .select({ started: count(), activeMs: sumOf(learningSessions.activeMs) })
      .from(learningSessions)
      .where(gte(learningSessions.startedAt, since))
  )[0];

const sessionsOf = (userId: string) => db.select({ id: learningSessions.id }).from(learningSessions).where(eq(learningSessions.userId, userId));

// For M1 (DPDP access): every study session and its steps.
export async function learnerSessions(userId: string) {
  const [sessions, steps] = await Promise.all([
    db.select().from(learningSessions).where(eq(learningSessions.userId, userId)),
    db.select().from(sessionSteps).where(inArray(sessionSteps.sessionId, sessionsOf(userId))),
  ]);
  return { sessions, steps };
}

// For M1 (DPDP erasure): only times and links here, kept only for learners who opted in to research or training.
export async function eraseSessions(userId: string, keepNumbers: boolean) {
  if (keepNumbers) return;
  await db.delete(sessionSteps).where(inArray(sessionSteps.sessionId, sessionsOf(userId)));
  await db.delete(learningSessions).where(eq(learningSessions.userId, userId));
}
