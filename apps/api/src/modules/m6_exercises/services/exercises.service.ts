import { AppError } from "../../../shared/errors/app-error.js";
import { getResources, getSkill } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/exercises.repository.js";

const notFound = () => new AppError(404, "EXERCISE_NOT_FOUND", "No such exercise");

export async function getExercise(id: string) {
  const exercise = await repo.findExercise(id);
  if (!exercise) throw notFound();
  return exercise;
}

// For M7: everything needed to run and judge a submission.
export async function getRunnableExercise(id: string) {
  const exercise = await repo.findRunnable(id);
  if (!exercise) throw notFound();
  return exercise;
}

// The learner-facing view, with the skill it practises: what the skill is about and where to read more.
export async function getServableExercise(id: string) {
  const exercise = await repo.findServable(id);
  if (!exercise) throw notFound();
  const [{ name, slug, description }, resources] = await Promise.all([
    getSkill(exercise.skillId),
    getResources(exercise.skillId, exercise.languageCode),
  ]);
  return { ...exercise, skill: { id: exercise.skillId, name, slug, description, resources } };
}

// For M5: every exercise a learner could be served for these skills.
export const listServable = repo.listServable;

// For M3: which of these exercises passed sandbox verification, so only those are ever asked.
export const verifiedIds = async (ids: string[]) => new Set((await repo.listVerified(ids)).map((e) => e.id));

// For M13: content coverage, and titles for the hardest-exercises list.
export const countServable = repo.countServable;
export const listTitles = repo.listTitles;

// For M8: server-only context for a hint. Practice exercises only.
export async function getHintContext(id: string) {
  const exercise = await repo.findForHints(id);
  if (!exercise) throw notFound();
  return exercise;
}

// For M8's hint generator: every verified practice exercise.
export const listPracticeIds = repo.listPracticeIds;

// For M13: generation success and failure by skill and rung.
export const generationStats = repo.generationStats;
