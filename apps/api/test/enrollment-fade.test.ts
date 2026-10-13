import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import {
  enrollments,
  fadeSchedules,
  fadeStages,
  skillScaffolding,
} from "../src/infrastructure/database/schema/index.js";
import { createCourse, createSkill, createUser, ensureLanguage, PG, pgError } from "./helpers.js";

describe("enrollment and fade schema", () => {
  it("rejects an enrollment in a language the course doesn't offer", async () => {
    await ensureLanguage("java");
    const [user, course] = [await createUser(), await createCourse()];
    const enroll = db.insert(enrollments).values({ userId: user.id, courseId: course.id, languageCode: "java" });
    await expect(enroll).rejects.toMatchObject(pgError(PG.foreignKey));
  });

  it("rejects a skill sitting on a fade stage its schedule doesn't have", async () => {
    const course = await createCourse();
    const [user, skill] = [await createUser(), await createSkill(course.id)];
    const [schedule] = await db.insert(fadeSchedules).values({ courseId: course.id, name: "Test" }).returning();
    await db.insert(fadeStages).values({ scheduleId: schedule.id, stageNo: 1, minRung: 1, maxHintLevel: 5, advanceRung: 2 });

    const onStage = (currentStage: number) =>
      db.insert(skillScaffolding).values({ userId: user.id, skillId: skill.id, languageCode: "cpp", scheduleId: schedule.id, currentStage });
    await expect(onStage(9)).rejects.toMatchObject(pgError(PG.foreignKey));
    await expect(onStage(1)).resolves.toBeDefined();
  });
});
