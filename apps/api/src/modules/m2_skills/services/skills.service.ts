import { AppError } from "../../../shared/errors/app-error.js";
import * as repo from "../repositories/skills.repository.js";

export async function getSkill(id: string) {
  const skill = await repo.findSkill(id);
  if (!skill) throw new AppError(404, "SKILL_NOT_FOUND", "No such skill");
  return skill;
}
