import { eq, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { skills } from "../../../infrastructure/database/schema/index.js";

const skillRef = {
  id: skills.id,
  courseId: skills.courseId,
  slug: skills.slug,
  name: skills.name,
  decayLambda: skills.decayLambda,
};

export const findSkill = async (id: string) => (await db.select(skillRef).from(skills).where(eq(skills.id, id)))[0];

export const findSkills = (ids: string[]) =>
  ids.length ? db.select(skillRef).from(skills).where(inArray(skills.id, ids)) : Promise.resolve([]);
