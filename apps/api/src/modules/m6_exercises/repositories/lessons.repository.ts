import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { lessons } from "../../../infrastructure/database/schema/index.js";

export type NewLesson = typeof lessons.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;

export const insertLesson = async (values: NewLesson) => (await db.insert(lessons).values(values).returning({ id: lessons.id }))[0].id;

// A skill's lessons in one language, newest first: the newest of each level is the one served.
export const listLessons = (skillId: string, languageCode: string) =>
  db.select().from(lessons).where(and(eq(lessons.skillId, skillId), eq(lessons.languageCode, languageCode))).orderBy(desc(lessons.createdAt));

export const hasLesson = async (key: Pick<NewLesson, "skillId" | "languageCode" | "level">) =>
  (
    await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(and(eq(lessons.skillId, key.skillId), eq(lessons.languageCode, key.languageCode), eq(lessons.level, key.level)))
  ).length > 0;
