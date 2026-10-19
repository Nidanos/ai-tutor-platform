import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db, type Tx } from "../../../infrastructure/database/index.js";
import { courseLanguages, courses, skillPrerequisites, skillResources, skills } from "../../../infrastructure/database/schema/index.js";

const skillRef = {
  id: skills.id,
  courseId: skills.courseId,
  slug: skills.slug,
  name: skills.name,
  description: skills.description,
  decayLambda: skills.decayLambda,
};

// q: pass the open transaction when called inside one, so it never waits on a second pool connection.
export const findSkill = async (id: string, q: Tx | typeof db = db) => (await q.select(skillRef).from(skills).where(eq(skills.id, id)))[0];

export const findSkills = (ids: string[]) =>
  ids.length ? db.select(skillRef).from(skills).where(inArray(skills.id, ids)) : Promise.resolve([]);

// Skills named with their course: for prerequisites that come from another course.
export const findSkillsWithCourse = (ids: string[]) =>
  ids.length
    ? db
        .select({ id: skills.id, slug: skills.slug, name: skills.name, course: courses.slug })
        .from(skills)
        .innerJoin(courses, eq(courses.id, skills.courseId))
        .where(inArray(skills.id, ids))
    : Promise.resolve([]);

// Only a course that is offered in this language.
export const findCourseBySlug = async (slug: string, languageCode: string) =>
  (
    await db
      .select({ id: courses.id, slug: courses.slug })
      .from(courses)
      .innerJoin(courseLanguages, eq(courseLanguages.courseId, courses.id))
      .where(and(eq(courses.slug, slug), eq(courseLanguages.languageCode, languageCode)))
  )[0];

// The course's active skills with their prerequisites for this language (null edges apply to all).
export async function listSkillGraph(courseId: string, languageCode: string) {
  const nodes = await db
    .select({ id: skills.id, slug: skills.slug, name: skills.name, description: skills.description, difficulty: skills.difficulty })
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

// A skill's further-reading links for this language (null = any language), active ones only, in order.
export const listResources = (skillId: string, languageCode: string) =>
  db
    .select({ title: skillResources.title, url: skillResources.url, kind: skillResources.kind })
    .from(skillResources)
    .where(
      and(
        eq(skillResources.skillId, skillId),
        eq(skillResources.isActive, true),
        or(isNull(skillResources.languageCode), eq(skillResources.languageCode, languageCode)),
      ),
    )
    .orderBy(skillResources.position);
