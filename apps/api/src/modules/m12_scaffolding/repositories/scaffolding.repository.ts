import { and, eq, max, sql } from "drizzle-orm";
import { db, type Tx } from "../../../infrastructure/database/index.js";
import { fadeSchedules, fadeStageChanges, fadeStages, skillScaffolding } from "../../../infrastructure/database/schema/index.js";

export type LearnerSkill = { userId: string; skillId: string; languageCode: string };

const FIRST_STAGE = 1;

const whereKey = (k: LearnerSkill) =>
  and(eq(skillScaffolding.userId, k.userId), eq(skillScaffolding.skillId, k.skillId), eq(skillScaffolding.languageCode, k.languageCode));

// The skill's current stage joined with that stage's rules.
const currentStageJoin = and(
  eq(fadeStages.scheduleId, skillScaffolding.scheduleId),
  eq(fadeStages.stageNo, skillScaffolding.currentStage),
);

const stageRules = {
  stageNo: fadeStages.stageNo,
  minRung: fadeStages.minRung,
  maxHintLevel: fadeStages.maxHintLevel,
  advanceRung: fadeStages.advanceRung,
  advanceMaxHints: fadeStages.advanceMaxHints,
};

const findStage = async (k: LearnerSkill) =>
  (await db.select(stageRules).from(skillScaffolding).innerJoin(fadeStages, currentStageJoin).where(whereKey(k)))[0];

export async function defaultScheduleId(q: Tx | typeof db, courseId: string) {
  const [schedule] = await q
    .select({ id: fadeSchedules.id })
    .from(fadeSchedules)
    .where(and(eq(fadeSchedules.courseId, courseId), eq(fadeSchedules.isDefault, true)));
  if (!schedule) throw new Error(`Course ${courseId} has no default fade schedule`);
  return schedule.id;
}

export const lastStageNo = async (tx: Tx, scheduleId: string) =>
  (await tx.select({ last: max(fadeStages.stageNo) }).from(fadeStages).where(eq(fadeStages.scheduleId, scheduleId)))[0].last!;

// Gives a skill its first stage, logged as its first stage change. False if it already had one.
export async function createStage(tx: Tx, key: LearnerSkill, scheduleId: string, stageNo: number, reason: string) {
  const [created] = await tx
    .insert(skillScaffolding)
    .values({ ...key, scheduleId, currentStage: stageNo })
    .onConflictDoNothing()
    .returning({ userId: skillScaffolding.userId });
  if (created) await tx.insert(fadeStageChanges).values({ ...key, toStage: stageNo, reason });
  return Boolean(created);
}

// A skill starts on stage 1 of its course's default schedule.
export async function ensureStage(key: LearnerSkill, courseId: string) {
  const current = await findStage(key);
  if (current) return current;
  const scheduleId = await defaultScheduleId(db, courseId);
  await db.transaction((tx) => createStage(tx, key, scheduleId, FIRST_STAGE, "first_attempt"));
  return (await findStage(key))!;
}

// Locked until the grading transaction ends, so two solves can't both move the same stage.
export const lockStage = async (tx: Tx, k: LearnerSkill) =>
  (
    await tx
      .select({ scheduleId: skillScaffolding.scheduleId, ...stageRules })
      .from(skillScaffolding)
      .innerJoin(fadeStages, currentStageJoin)
      .where(whereKey(k))
      .for("update", { of: skillScaffolding })
  )[0];

export const stageExists = async (tx: Tx, scheduleId: string, stageNo: number) =>
  (
    await tx
      .select({ stageNo: fadeStages.stageNo })
      .from(fadeStages)
      .where(and(eq(fadeStages.scheduleId, scheduleId), eq(fadeStages.stageNo, stageNo)))
  ).length > 0;

// Every move is logged with what caused it (a solve, or the diagnostic): the evidence that help really fades (ADR-0007).
export async function moveStage(tx: Tx, k: LearnerSkill, from: number, to: number, submissionId: string | null, reason = "solved") {
  await tx.update(skillScaffolding).set({ currentStage: to, stageEnteredAt: new Date() }).where(whereKey(k));
  await tx.insert(fadeStageChanges).values({ ...k, fromStage: from, toStage: to, submissionId, reason });
}

export const listStates = (userId: string, languageCode?: string) =>
  db
    .select({
      skillId: skillScaffolding.skillId,
      languageCode: skillScaffolding.languageCode,
      stageEnteredAt: skillScaffolding.stageEnteredAt,
      description: fadeStages.description,
      totalStages: sql<number>`(select count(*) from ${fadeStages} where ${fadeStages.scheduleId} = ${skillScaffolding.scheduleId})`.mapWith(Number),
      ...stageRules,
    })
    .from(skillScaffolding)
    .innerJoin(fadeStages, currentStageJoin)
    .where(and(eq(skillScaffolding.userId, userId), languageCode ? eq(skillScaffolding.languageCode, languageCode) : undefined));
