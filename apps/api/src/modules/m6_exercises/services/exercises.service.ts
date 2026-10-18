import { AppError } from "../../../shared/errors/app-error.js";
import { getSkill } from "../../m2_skills/services/skills.service.js";
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

// The learner-facing view, with the skill it practises.
export async function getServableExercise(id: string) {
  const exercise = await repo.findServable(id);
  if (!exercise) throw notFound();
  const { name, slug } = await getSkill(exercise.skillId);
  return { ...exercise, skill: { id: exercise.skillId, name, slug } };
}

// For M5: every exercise a learner could be served for these skills.
export const listServable = repo.listServable;

// For M3: which of these exercises passed sandbox verification, so only those are ever asked.
export const verifiedIds = async (ids: string[]) => new Set((await repo.listVerified(ids)).map((e) => e.id));
