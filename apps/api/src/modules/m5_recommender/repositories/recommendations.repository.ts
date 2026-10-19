import { eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { recommendations } from "../../../infrastructure/database/schema/index.js";

export const insertRecommendation = async (values: typeof recommendations.$inferInsert) =>
  (await db.insert(recommendations).values(values).returning({ id: recommendations.id }))[0].id;

export const findRecommendation = async (id: string) =>
  (
    await db
      .select({ skillId: recommendations.skillId, rung: recommendations.rung, reason: recommendations.reason, exerciseId: recommendations.exerciseId })
      .from(recommendations)
      .where(eq(recommendations.id, id))
  )[0];

// For M1 (DPDP access): every pick made on these enrollments, with its reasons.
export const listForEnrollments = (enrollmentIds: string[]) =>
  db.select().from(recommendations).where(inArray(recommendations.enrollmentId, enrollmentIds));

// For M1 (DPDP erasure): only scores here, kept only for learners who opted in to research or training.
export async function eraseForEnrollments(enrollmentIds: string[], keepNumbers: boolean) {
  if (!keepNumbers) await db.delete(recommendations).where(inArray(recommendations.enrollmentId, enrollmentIds));
}
