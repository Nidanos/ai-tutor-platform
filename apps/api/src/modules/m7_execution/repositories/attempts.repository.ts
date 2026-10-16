import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { exerciseAttempts } from "../../../infrastructure/database/schema/index.js";

const attemptView = {
  id: exerciseAttempts.id,
  status: exerciseAttempts.status,
  hintLevel: exerciseAttempts.hintLevel,
  hintCeiling: exerciseAttempts.hintCeiling,
  submissionCount: exerciseAttempts.submissionCount,
};

export const findLatestAttempt = async (userId: string, exerciseId: string) =>
  (
    await db
      .select(attemptView)
      .from(exerciseAttempts)
      .where(and(eq(exerciseAttempts.userId, userId), eq(exerciseAttempts.exerciseId, exerciseId)))
      .orderBy(desc(exerciseAttempts.createdAt))
      .limit(1)
  )[0];

// Two tabs opening the same exercise at once still get one active attempt (partial unique index).
export const insertAttempt = (values: typeof exerciseAttempts.$inferInsert) =>
  db.insert(exerciseAttempts).values(values).onConflictDoNothing();

export const listAttempts = (userId: string) =>
  db.select({ exerciseId: exerciseAttempts.exerciseId, status: exerciseAttempts.status }).from(exerciseAttempts).where(eq(exerciseAttempts.userId, userId));
