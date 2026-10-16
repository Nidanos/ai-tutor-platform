import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { courses, skillPrerequisites, skills } from "../../../infrastructure/database/schema/index.js";

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

export const findCourseBySlug = async (slug: string) =>
  (await db.select({ id: courses.id, slug: courses.slug }).from(courses).where(eq(courses.slug, slug)))[0];

// The course's active skills with their prerequisites for this language (null edges apply to all).
export async function listSkillGraph(courseId: string, languageCode: string) {
  const nodes = await db
    .select({ id: skills.id, slug: skills.slug, name: skills.name, difficulty: skills.difficulty })
    .from(skills)
    .where(and(eq(skills.courseId, courseId), eq(skills.status, "active")));
  const edges = await db
    .select({ skillId: skillPrerequisites.skillId, id: skillPrerequisites.prerequisiteId, minMastery: skillPrerequisites.minMastery })
    .from(skillPrerequisites)
    .where(
      and(
        inArray(skillPrerequisites.skillId, nodes.map((n) => n.id)),
        or(isNull(skillPrerequisites.languageCode), eq(skillPrerequisites.languageCode, languageCode)),
      ),
    );
  return nodes.map((n) => ({ ...n, prerequisites: edges.filter((e) => e.skillId === n.id).map(({ id, minMastery }) => ({ id, minMastery })) }));
}
