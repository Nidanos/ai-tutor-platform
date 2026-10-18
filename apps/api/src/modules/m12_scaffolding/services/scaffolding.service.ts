import type { Tx } from "../../../infrastructure/database/index.js";
import { getSkills } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/scaffolding.repository.js";

// Only M12 writes fade stages (design §3). The stage sets how much help an attempt may get.
export const getStage = repo.ensureStage;

export type Solve = repo.LearnerSkill & { rung: number; hintsUsed: number; submissionId: string };

// Runs inside the grading transaction on an AC (ADR-0007): solving the stage's rung, or a harder
// one, with few enough hints moves the skill one stage on. The last stage has nowhere to go:
// solving it is what clears the skill (M4).
export async function advanceOnSolve(tx: Tx, { rung, hintsUsed, submissionId, ...key }: Solve) {
  const stage = await repo.lockStage(tx, key);
  if (!stage || rung < stage.advanceRung || hintsUsed > stage.advanceMaxHints) return;
  const next = stage.stageNo + 1;
  if (await repo.stageExists(tx, stage.scheduleId, next)) await repo.moveStage(tx, key, stage.stageNo, next, submissionId);
}

// The diagnostic's fast-track (ADR-0012): a skill proven in the placement test goes straight to its
// schedule's last stage. Runs inside the diagnostic's completion transaction; never moves a stage down.
export async function startAtLastStage(tx: Tx, key: repo.LearnerSkill, courseId: string) {
  const scheduleId = await repo.defaultScheduleId(tx, courseId);
  if (await repo.createStage(tx, key, scheduleId, await repo.lastStageNo(tx, scheduleId), "diagnostic")) return;
  const stage = (await repo.lockStage(tx, key))!;
  const last = await repo.lastStageNo(tx, stage.scheduleId);
  if (stage.stageNo < last) await repo.moveStage(tx, key, stage.stageNo, last, null, "diagnostic");
}

// GET /scaffolding/state: how much help each practised skill allows now, and what moves it on.
export async function listState(userId: string, languageCode?: string) {
  const states = await repo.listStates(userId, languageCode);
  const skillOf = new Map((await getSkills(states.map((s) => s.skillId))).map((s) => [s.id, s]));
  return states.map(({ skillId, stageNo, totalStages, ...rest }) => {
    const { id, slug, name } = skillOf.get(skillId)!;
    return { skill: { id, slug, name }, stage: stageNo, totalStages, ...rest };
  });
}

// For M5: the easiest rung each opened skill currently allows. Unopened skills start at rung 1.
export async function minRungs(userId: string, languageCode: string) {
  return new Map((await repo.listStates(userId, languageCode)).map((s) => [s.skillId, s.minRung]));
}

// For M13: stage moves by cause.
export const stageMoves = repo.stageMoves;
