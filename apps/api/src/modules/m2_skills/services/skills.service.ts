import { AppError } from "../../../shared/errors/app-error.js";
import type { Tx, db } from "../../../infrastructure/database/index.js";
import * as repo from "../repositories/skills.repository.js";

export async function getSkill(id: string, q?: Tx | typeof db) {
  const skill = await repo.findSkill(id, q);
  if (!skill) throw new AppError(404, "SKILL_NOT_FOUND", "No such skill");
  return skill;
}

export const getSkills = (ids: string[]) => repo.findSkills(ids);

export async function getCourse(slug: string, languageCode: string) {
  const course = await repo.findCourseBySlug(slug, languageCode);
  if (!course) throw new AppError(404, "COURSE_NOT_FOUND", "No such course in this language");
  return course;
}

export const getSkillGraph = repo.listSkillGraph;

// Every skill below this one in the graph (its prerequisites, theirs, and so on).
export function prerequisitesOf<T extends { id: string; prerequisites: { id: string }[] }>(graph: T[], skillId: string) {
  const byId = new Map(graph.map((s) => [s.id, s]));
  const found = new Set<string>();
  const visit = (id: string): void =>
    byId.get(id)?.prerequisites.forEach((p) => {
      if (found.has(p.id)) return;
      found.add(p.id);
      visit(p.id);
    });
  visit(skillId);
  return graph.filter((s) => found.has(s.id));
}
