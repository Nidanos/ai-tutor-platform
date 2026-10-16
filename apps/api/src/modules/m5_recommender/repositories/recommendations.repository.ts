import { db } from "../../../infrastructure/database/index.js";
import { recommendations } from "../../../infrastructure/database/schema/index.js";

export const insertRecommendation = async (values: typeof recommendations.$inferInsert) =>
  (await db.insert(recommendations).values(values).returning({ id: recommendations.id }))[0].id;
