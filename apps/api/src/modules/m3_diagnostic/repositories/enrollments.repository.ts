import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { enrollments } from "../../../infrastructure/database/schema/index.js";

// One enrollment per learner, course and language: created once, then found.
export async function ensureEnrollment(userId: string, courseId: string, languageCode: string) {
  await db.insert(enrollments).values({ userId, courseId, languageCode }).onConflictDoNothing();
  const [enrollment] = await db
    .select({ id: enrollments.id, goalSkillId: enrollments.goalSkillId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), eq(enrollments.languageCode, languageCode)));
  return enrollment;
}

export const findEnrollment = async (id: string) =>
  (
    await db
      .select({ id: enrollments.id, courseId: enrollments.courseId, languageCode: enrollments.languageCode, goalSkillId: enrollments.goalSkillId })
      .from(enrollments)
      .where(eq(enrollments.id, id))
  )[0];

// For M1 (DPDP access): the courses this learner joined.
export const learnerEnrollments = (userId: string) => db.select().from(enrollments).where(eq(enrollments.userId, userId));

// For M1 (DPDP erasure). The goal is the learner's own words: it goes even when the numbers stay.
export const eraseEnrollments = (userId: string, keepNumbers: boolean) =>
  keepNumbers
    ? db.update(enrollments).set({ goalText: null }).where(eq(enrollments.userId, userId))
    : db.delete(enrollments).where(eq(enrollments.userId, userId));
