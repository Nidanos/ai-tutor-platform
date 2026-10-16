import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { enrollments } from "../../../infrastructure/database/schema/index.js";

// One enrollment per learner, course and language: created once, then found.
export async function ensureEnrollment(userId: string, courseId: string, languageCode: string) {
  await db.insert(enrollments).values({ userId, courseId, languageCode }).onConflictDoNothing();
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId), eq(enrollments.languageCode, languageCode)));
  return enrollment.id;
}
