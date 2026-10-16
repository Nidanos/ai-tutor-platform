import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { exercises, exerciseSecrets, exerciseTests } from "../../../infrastructure/database/schema/index.js";

export const findExercise = async (id: string) =>
  (
    await db
      .select({
        id: exercises.id,
        skillId: exercises.skillId,
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

// What a learner may see: verified practice exercises and their sample tests only.
// Harness, reference solution and hidden tests never leave the server.
export async function findServable(id: string) {
  const [exercise] = await db
    .select({
      id: exercises.id,
      skillId: exercises.skillId,
      languageCode: exercises.languageCode,
      rung: exercises.rung,
      title: exercises.title,
      promptMd: exercises.promptMd,
      starterCode: exercises.starterCode,
      functionSignature: exercises.functionSignature,
      timeLimitMs: exercises.timeLimitMs,
      memoryLimitMb: exercises.memoryLimitMb,
    })
    .from(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.status, "verified"), eq(exercises.purpose, "practice")));
  if (!exercise) return undefined;
  const sampleTests = await db
    .select({ seq: exerciseTests.seq, name: exerciseTests.name, input: exerciseTests.input, expectedOutput: exerciseTests.expectedOutput })
    .from(exerciseTests)
    .where(and(eq(exerciseTests.exerciseId, id), eq(exerciseTests.visibility, "sample")))
    .orderBy(asc(exerciseTests.seq));
  return { ...exercise, sampleTests };
}
