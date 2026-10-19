import { and, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { courses, skillPrerequisites, skills } from "../src/infrastructure/database/schema/index.js";
import type { SkillSeed } from "../src/infrastructure/database/seed/cpp-basics.js";
import { seedSkills } from "../src/infrastructure/database/seed/seed-skills.js";
import { createCourse, createSkill, PG, pgError, uniq } from "./helpers.js";

const seed = (slug: string, needs: string[] = []): SkillSeed => ({ slug, name: slug, description: "-", type: "conceptual", difficulty: 1, needs, resources: [] });

describe("curriculum schema", () => {
  it("rejects a skill that requires itself", async () => {
    const skill = await createSkill((await createCourse()).id);
    const edge = db.insert(skillPrerequisites).values({ skillId: skill.id, prerequisiteId: skill.id });
    await expect(edge).rejects.toMatchObject(pgError(PG.check));
  });

  it("rejects a duplicate edge even when it applies to every language (null)", async () => {
    const course = await createCourse();
    const [a, b] = [await createSkill(course.id), await createSkill(course.id)];
    const edge = { skillId: a.id, prerequisiteId: b.id };
    await db.insert(skillPrerequisites).values(edge);
    await expect(db.insert(skillPrerequisites).values(edge)).rejects.toMatchObject(pgError(PG.unique));
  });

  it("seeds a prerequisite from another course, and refuses one that isn't seeded yet", async () => {
    const [basics, advanced] = [uniq(), uniq()];
    await db.insert(courses).values([{ slug: basics, title: "Basics" }, { slug: advanced, title: "Advanced" }]);
    await seedSkills(basics, [seed("pointers")]);
    await seedSkills(advanced, [seed("linked-lists", [`${basics}/pointers`]), seed("deques", ["linked-lists"])]);

    const idOf = async (course: string, slug: string) =>
      (await db.select({ id: skills.id }).from(skills).innerJoin(courses, eq(courses.id, skills.courseId)).where(and(eq(courses.slug, course), eq(skills.slug, slug))))[0].id;
    const [lists, deques] = [await idOf(advanced, "linked-lists"), await idOf(advanced, "deques")];
    const edges = await db.select().from(skillPrerequisites).where(inArray(skillPrerequisites.skillId, [lists, deques]));
    expect(edges.filter((e) => e.skillId === lists).map((e) => e.prerequisiteId)).toEqual([await idOf(basics, "pointers")]);
    expect(edges.filter((e) => e.skillId === deques).map((e) => e.prerequisiteId)).toEqual([lists]);

    await expect(seedSkills(advanced, [seed("trees", [`${basics}/recursion`])])).rejects.toThrow(`${basics}/recursion`);
  });
});
