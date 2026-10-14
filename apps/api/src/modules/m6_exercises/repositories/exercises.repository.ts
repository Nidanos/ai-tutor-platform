import { asc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { exercises, exerciseSecrets, exerciseTests } from "../../../infrastructure/database/schema/index.js";

export const findExercise = async (id: string) =>
  (
    await db
      .select({
        id: exercises.id,
        rung: exercises.rung,
        languageCode: exercises.languageCode,
        timeLimitMs: exercises.timeLimitMs,
        memoryLimitMb: exercises.memoryLimitMb,
      })
      .from(exercises)
      .where(eq(exercises.id, id))
  )[0];

// Server-only: the harness and every test's expected output. Never returned to a client as is.
export async function findRunnable(id: string) {
  const exercise = await findExercise(id);
  if (!exercise) return undefined;
  const [secrets] = await db
    .select({ harnessCode: exerciseSecrets.harnessCode })
    .from(exerciseSecrets)
    .where(eq(exerciseSecrets.exerciseId, id));
  const tests = await db.select().from(exerciseTests).where(eq(exerciseTests.exerciseId, id)).orderBy(asc(exerciseTests.seq));
  return { ...exercise, harnessCode: secrets?.harnessCode ?? null, tests };
}
