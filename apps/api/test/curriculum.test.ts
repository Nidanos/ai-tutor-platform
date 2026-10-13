import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { skillPrerequisites } from "../src/infrastructure/database/schema/index.js";
import { createCourse, createSkill, PG, pgError } from "./helpers.js";

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
});
