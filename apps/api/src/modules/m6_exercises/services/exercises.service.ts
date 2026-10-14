import { AppError } from "../../../shared/errors/app-error.js";
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
