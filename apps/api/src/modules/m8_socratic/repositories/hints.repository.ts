import { and, count, eq, gte, isNotNull } from "drizzle-orm";
import { countWhere } from "../../../infrastructure/database/aggregates.js";
import { db } from "../../../infrastructure/database/index.js";
import { exerciseAttempts, exerciseHints, hintEvents } from "../../../infrastructure/database/schema/index.js";

export type HintEvent = Omit<typeof hintEvents.$inferInsert, "attemptId" | "level">;

export const findFrozenHint = async (exerciseId: string, level: number) =>
  (await db.select({ id: exerciseHints.id, bodyMd: exerciseHints.bodyMd }).from(exerciseHints).where(and(eq(exerciseHints.exerciseId, exerciseId), eq(exerciseHints.level, level))))[0];

export const logEvent = (attemptId: string, level: number, event: HintEvent) => db.insert(hintEvents).values({ attemptId, level, ...event });

// Live calls this learner has used since `since` (delivered or blocked): the daily cap.
export const liveCallsSince = async (userId: string, since: Date) =>
  (
    await db
      .select({ n: count() })
      .from(hintEvents)
      .innerJoin(exerciseAttempts, eq(exerciseAttempts.id, hintEvents.attemptId))
      .where(and(eq(exerciseAttempts.userId, userId), isNotNull(hintEvents.llmCallId), gte(hintEvents.createdAt, since)))
  )[0].n;

// FR-M8-01/03: the level moves one step, only from where the request saw it, and the hint is logged
// with it. False if another request moved it first (a double click).
export const giveHint = (attemptId: string, level: number, event: HintEvent) =>
  db.transaction(async (tx) => {
    const [raised] = await tx
      .update(exerciseAttempts)
      .set({ hintLevel: level, updatedAt: new Date(), ...(level === 5 && { bottomedOut: true }) })
      .where(and(eq(exerciseAttempts.id, attemptId), eq(exerciseAttempts.hintLevel, level - 1), eq(exerciseAttempts.status, "active")))
      .returning({ id: exerciseAttempts.id });
    if (raised) await tx.insert(hintEvents).values({ attemptId, level, ...event });
    return Boolean(raised);
  });

export const insertFrozenHints = (rows: (typeof exerciseHints.$inferInsert)[]) => db.insert(exerciseHints).values(rows).onConflictDoNothing();

export const storedLevels = async (exerciseId: string) =>
  (await db.select({ level: exerciseHints.level }).from(exerciseHints).where(eq(exerciseHints.exerciseId, exerciseId))).map((h) => h.level);

// For M13 (FR-M13-02): hint use in the window, and where the delivered hints came from.
export async function hintStats(since: Date) {
  const delivered = eq(hintEvents.kind, "delivered");
  return (
    await db
      .select({
        delivered: countWhere(delivered),
        live: countWhere(and(delivered, isNotNull(hintEvents.llmCallId))!),
        frozen: countWhere(and(delivered, isNotNull(hintEvents.hintId))!),
        blocked: countWhere(eq(hintEvents.kind, "blocked")),
        deniedCeiling: countWhere(eq(hintEvents.kind, "denied_ceiling")),
        bottomedOut: countWhere(eq(hintEvents.kind, "bottomed_out")),
      })
      .from(hintEvents)
      .where(gte(hintEvents.createdAt, since))
  )[0];
}
