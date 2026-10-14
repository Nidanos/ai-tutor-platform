import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../index.js";
import { courses, skillPrerequisites, skillResources, skills } from "../schema/index.js";
import type { SkillSeed } from "./cpp-basics.js";

// Placeholders until calibration: syntax fades in ~2 weeks, concepts in ~5 (half-life = ln 2 / λ).
const DECAY_PER_DAY = { syntactic: 0.05, conceptual: 0.02 } as const;

// Re-seeding updates skills in place and replaces their resources, so the data file is the source of
// truth for links. Removing an edge from the data doesn't delete it.
export async function seedSkills(courseSlug: string, list: SkillSeed[]) {
  const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, courseSlug));

  await db
    .insert(skills)
    .values(
      list.map((s) => ({
        courseId: course.id,
        slug: s.slug,
        name: s.name,
        description: s.description,
        skillType: s.type,
        decayLambda: DECAY_PER_DAY[s.type],
        difficulty: s.difficulty,
      })),
    )
    .onConflictDoUpdate({
      target: [skills.courseId, skills.slug],
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        skillType: sql`excluded.skill_type`,
        decayLambda: sql`excluded.decay_lambda`,
        difficulty: sql`excluded.difficulty`,
      },
    });

  const rows = await db.select({ id: skills.id, slug: skills.slug }).from(skills).where(eq(skills.courseId, course.id));
  const idOf = new Map(rows.map((r) => [r.slug, r.id]));

  const edges = list.flatMap((s) => s.needs.map((need) => ({ skillId: idOf.get(s.slug)!, prerequisiteId: idOf.get(need)! })));
  if (edges.length) await db.insert(skillPrerequisites).values(edges).onConflictDoNothing();

  const resources = list.flatMap((s) => s.resources.map((r, position) => ({ skillId: idOf.get(s.slug)!, ...r, position })));
  await db.transaction(async (tx) => {
    await tx.delete(skillResources).where(inArray(skillResources.skillId, [...idOf.values()]));
    if (resources.length) await tx.insert(skillResources).values(resources);
  });
}
