import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { lessonNotes } from "../../../infrastructure/database/schema/index.js";

export const latestNote = async (userId: string, skillId: string, languageCode: string) =>
  (
    await db
      .select()
      .from(lessonNotes)
      .where(and(eq(lessonNotes.userId, userId), eq(lessonNotes.skillId, skillId), eq(lessonNotes.languageCode, languageCode)))
      .orderBy(desc(lessonNotes.createdAt))
      .limit(1)
  )[0];

export const insertNote = (values: typeof lessonNotes.$inferInsert) => db.insert(lessonNotes).values(values);

export const notesSince = async (userId: string, since: Date) =>
  (await db.select({ n: count() }).from(lessonNotes).where(and(eq(lessonNotes.userId, userId), gte(lessonNotes.createdAt, since))))[0].n;

// For M1 (DPDP access and erasure). Notes are written for one person, so they always go with the account.
export const learnerNotes = (userId: string) => db.select().from(lessonNotes).where(eq(lessonNotes.userId, userId));
export const eraseNotes = (userId: string) => db.delete(lessonNotes).where(eq(lessonNotes.userId, userId));
