import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { exercises } from "../src/infrastructure/database/schema/index.js";
import { createCourse, createExercise, createSkill, exerciseRow, PG, pgError } from "./helpers.js";

describe("exercises schema", () => {
  it("rejects a second exercise with the same content key", async () => {
    const skill = await createSkill((await createCourse()).id);
    await createExercise(skill.id);
    await expect(createExercise(skill.id)).rejects.toMatchObject(pgError(PG.unique));
  });

  it("rejects a rung outside 1 to 5", async () => {
    const skill = await createSkill((await createCourse()).id);
    await expect(db.insert(exercises).values(exerciseRow(skill.id, 6))).rejects.toMatchObject(pgError(PG.check));
  });
});
