import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { courses, skillPrerequisites, skillResources, skills } from "../schema/index.js";
import type { SkillSeed } from "./cpp-basics.js";

// Placeholders until calibration: syntax fades in ~2 weeks, concepts in ~5 (half-life = ln 2 / λ).
const DECAY_PER_DAY = { syntactic: 0.05, conceptual: 0.02 } as const;

// Skills are upserted, so editing the data file and re-seeding updates them.
// Edges and resources are only added; removing one from the data doesn't delete it.
export async function seedSkills(courseSlug: string, sourceUrl: string, list: SkillSeed[]) {
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
        sourceUrl,
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
        sourceUrl: sql`excluded.source_url`,
      },
    });

  const rows = await db.select({ id: skills.id, slug: skills.slug }).from(skills).where(eq(skills.courseId, course.id));
  const idOf = new Map(rows.map((r) => [r.slug, r.id]));

  const edges = list.flatMap((s) => s.needs.map((need) => ({ skillId: idOf.get(s.slug)!, prerequisiteId: idOf.get(need)! })));
  if (edges.length) await db.insert(skillPrerequisites).values(edges).onConflictDoNothing();

  const resources = list.flatMap((s) => s.resources.map((r, position) => ({ skillId: idOf.get(s.slug)!, ...r, position })));
  if (resources.length) await db.insert(skillResources).values(resources).onConflictDoNothing();
}
