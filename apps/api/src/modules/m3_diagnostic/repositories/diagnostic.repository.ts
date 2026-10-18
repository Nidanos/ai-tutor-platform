import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db, type Tx } from "../../../infrastructure/database/index.js";
import {
  diagnosticAttempts,
  diagnosticItems,
  diagnosticResponses,
  diagnosticResults,
  enrollments,
} from "../../../infrastructure/database/schema/index.js";

const attemptView = {
  id: diagnosticAttempts.id,
  enrollmentId: diagnosticAttempts.enrollmentId,
  attemptNo: diagnosticAttempts.attemptNo,
  status: diagnosticAttempts.status,
  startedAt: diagnosticAttempts.startedAt,
  completedAt: diagnosticAttempts.completedAt,
  courseId: enrollments.courseId,
  languageCode: enrollments.languageCode,
};
export type DiagnosticAttempt = NonNullable<Awaited<ReturnType<typeof findOwn>>>;

const attempts = () => db.select(attemptView).from(diagnosticAttempts).innerJoin(enrollments, eq(enrollments.id, diagnosticAttempts.enrollmentId));

export const findOwn = async (id: string, userId: string) =>
  (await attempts().where(and(eq(diagnosticAttempts.id, id), eq(enrollments.userId, userId))))[0];

export const findLatest = async (enrollmentId: string) =>
  (await attempts().where(eq(diagnosticAttempts.enrollmentId, enrollmentId)).orderBy(desc(diagnosticAttempts.attemptNo)).limit(1))[0];

// Two tabs starting at once get the same attempt (one in progress per enrollment, numbers unique).
export async function createAttempt(enrollmentId: string, attemptNo: number) {
  await db.insert(diagnosticAttempts).values({ enrollmentId, attemptNo }).onConflictDoNothing();
  return (await findLatest(enrollmentId))!;
}

// Published items only, newest first: a corrected item supersedes the old one once it is verified.
// The answer key stays in the verified exercise and is never selected here.
export const listItems = (skillIds: string[], languageCode: string) =>
  skillIds.length
    ? db
        .select({
          id: diagnosticItems.id,
          skillId: diagnosticItems.skillId,
          dimension: diagnosticItems.dimension,
          promptMd: diagnosticItems.promptMd,
          payload: diagnosticItems.payload,
          exerciseId: diagnosticItems.exerciseId,
        })
        .from(diagnosticItems)
        .where(
          and(
            inArray(diagnosticItems.skillId, skillIds),
            eq(diagnosticItems.languageCode, languageCode),
            eq(diagnosticItems.status, "published"),
            isNotNull(diagnosticItems.exerciseId),
          ),
        )
        .orderBy(desc(diagnosticItems.id)) // uuidv7: newest first
    : Promise.resolve([]);

export const listResponses = (diagnosticId: string) =>
  db.select().from(diagnosticResponses).where(eq(diagnosticResponses.diagnosticId, diagnosticId)).orderBy(asc(diagnosticResponses.seq));

// A double click loses the race on (diagnostic, item) or on seq, and is treated as a replay.
export const insertResponse = (values: typeof diagnosticResponses.$inferInsert) =>
  db.insert(diagnosticResponses).values(values).onConflictDoNothing();

export const setCorrect = (id: string, isCorrect: boolean) =>
  db.update(diagnosticResponses).set({ isCorrect }).where(eq(diagnosticResponses.id, id));

// Completes the attempt, stores the estimates and runs afterSave (the M4/M12 seeding) in one
// transaction. Only the call that moves it out of in_progress does any of it; the rest do nothing.
export const finish = (id: string, results: (typeof diagnosticResults.$inferInsert)[], afterSave: (tx: Tx) => Promise<void>) =>
  db.transaction(async (tx) => {
    const [done] = await tx
      .update(diagnosticAttempts)
      .set({ status: "completed", completedAt: new Date() })
      .where(and(eq(diagnosticAttempts.id, id), eq(diagnosticAttempts.status, "in_progress")))
      .returning({ id: diagnosticAttempts.id });
    if (!done) return;
    if (results.length) await tx.insert(diagnosticResults).values(results); // none if every skill was already cleared
    await afterSave(tx);
  });

export const listResults = (diagnosticId: string) =>
  db.select().from(diagnosticResults).where(eq(diagnosticResults.diagnosticId, diagnosticId));
