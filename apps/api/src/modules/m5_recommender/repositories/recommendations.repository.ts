import { eq } from "drizzle-orm";
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
