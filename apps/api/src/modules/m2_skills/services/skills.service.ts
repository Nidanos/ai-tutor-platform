import { AppError } from "../../../shared/errors/app-error.js";
import type { Tx, db } from "../../../infrastructure/database/index.js";
import * as repo from "../repositories/skills.repository.js";

export async function getSkill(id: string, q?: Tx | typeof db) {
  const skill = await repo.findSkill(id, q);
  if (!skill) throw new AppError(404, "SKILL_NOT_FOUND", "No such skill");
  return skill;
}

export const getSkills = (ids: string[]) => repo.findSkills(ids);
export const getCourseSlug = repo.findCourseSlug;

export async function getCourse(slug: string, languageCode: string) {
  const course = await repo.findCourseBySlug(slug, languageCode);
  if (!course) throw new AppError(404, "COURSE_NOT_FOUND", "No such course in this language");
  return course;
}

// A course's skills; a prerequisite can be a skill of another course (DSA builds on C++ basics).
export const getSkillGraph = repo.listSkillGraph;
export const getSkillsWithCourse = repo.findSkillsWithCourse;
export const getResources = repo.listResources;

// Names of every skill below this one, across courses: the features generated content may use.
export const getAncestorNames = repo.listAncestorNames;
