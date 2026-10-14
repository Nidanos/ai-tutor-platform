import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { skills } from "../../../infrastructure/database/schema/index.js";

export const findSkill = async (id: string) =>
  (await db.select({ id: skills.id, decayLambda: skills.decayLambda }).from(skills).where(eq(skills.id, id)))[0];
