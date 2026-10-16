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

// GET /scaffolding/state: how much help each practised skill allows now, and what moves it on.
export async function listState(userId: string, languageCode?: string) {
  const states = await repo.listStates(userId, languageCode);
  const skillOf = new Map((await getSkills(states.map((s) => s.skillId))).map((s) => [s.id, s]));
  return states.map(({ skillId, stageNo, totalStages, ...rest }) => {
    const { id, slug, name } = skillOf.get(skillId)!;
    return { skill: { id, slug, name }, stage: stageNo, totalStages, ...rest };
  });
}
