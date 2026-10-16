import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { fadeSchedules, fadeStageChanges, fadeStages, skillScaffolding } from "../../../infrastructure/database/schema/index.js";

export type LearnerSkill = { userId: string; skillId: string; languageCode: string };

const FIRST_STAGE = 1;

const findStage = async (k: LearnerSkill) =>
  (
    await db
      .select({ stageNo: fadeStages.stageNo, minRung: fadeStages.minRung, maxHintLevel: fadeStages.maxHintLevel })
      .from(skillScaffolding)
      .innerJoin(
        fadeStages,
        and(eq(fadeStages.scheduleId, skillScaffolding.scheduleId), eq(fadeStages.stageNo, skillScaffolding.currentStage)),
      )
      .where(
        and(eq(skillScaffolding.userId, k.userId), eq(skillScaffolding.skillId, k.skillId), eq(skillScaffolding.languageCode, k.languageCode)),
      )
  )[0];

// A skill starts on stage 1 of its course's default schedule, logged as its first stage change.
export async function ensureStage(key: LearnerSkill, courseId: string) {
  const current = await findStage(key);
  if (current) return current;

  const [schedule] = await db
    .select({ id: fadeSchedules.id })
    .from(fadeSchedules)
    .where(and(eq(fadeSchedules.courseId, courseId), eq(fadeSchedules.isDefault, true)));
  if (!schedule) throw new Error(`Course ${courseId} has no default fade schedule`);

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(skillScaffolding)
      .values({ ...key, scheduleId: schedule.id, currentStage: FIRST_STAGE })
      .onConflictDoNothing()
      .returning({ userId: skillScaffolding.userId });
    if (created) await tx.insert(fadeStageChanges).values({ ...key, toStage: FIRST_STAGE, reason: "first_attempt" });
  });
  return (await findStage(key))!;
}
