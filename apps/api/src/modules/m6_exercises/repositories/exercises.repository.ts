import { and, asc, count, eq, inArray } from "drizzle-orm";
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
  if (exercise.rung === 1) return { ...exercise, sampleTests: [] }; // its only test is the answer to "what does it print?"
  const sampleTests = await db
    .select({ seq: exerciseTests.seq, name: exerciseTests.name, input: exerciseTests.input, expectedOutput: exerciseTests.expectedOutput })
    .from(exerciseTests)
    .where(and(eq(exerciseTests.exerciseId, id), eq(exerciseTests.visibility, "sample")))
    .orderBy(asc(exerciseTests.seq));
  return { ...exercise, sampleTests };
}

// Everything the verifier needs: the reference and starter code, the harness, every test.
export async function findForVerification(id: string) {
  const runnable = await findRunnable(id);
  if (!runnable) return undefined;
  const [extra] = await db
    .select({ starterCode: exercises.starterCode, referenceSolution: exerciseSecrets.referenceSolution })
    .from(exercises)
    .innerJoin(exerciseSecrets, eq(exerciseSecrets.exerciseId, exercises.id))
    .where(eq(exercises.id, id));
  return extra && { ...runnable, ...extra };
}

export const listByStatus = (status: (typeof exercises.$inferSelect)["status"]) =>
  db.select({ id: exercises.id, title: exercises.title, rung: exercises.rung }).from(exercises).where(eq(exercises.status, status));

export const setStatus = (id: string, status: "verified" | "rejected") =>
  db
    .update(exercises)
    .set({ status, verifiedAt: status === "verified" ? new Date() : null })
    .where(eq(exercises.id, id));

export const listServable = (skillIds: string[], languageCode: string) =>
  skillIds.length
    ? db
        .select({ id: exercises.id, skillId: exercises.skillId, rung: exercises.rung })
        .from(exercises)
        .where(
          and(
            inArray(exercises.skillId, skillIds),
            eq(exercises.languageCode, languageCode),
            eq(exercises.status, "verified"),
            eq(exercises.purpose, "practice"),
          ),
        )
    : Promise.resolve([]);

export const listVerified = (ids: string[]) =>
  ids.length
    ? db.select({ id: exercises.id }).from(exercises).where(and(inArray(exercises.id, ids), eq(exercises.status, "verified")))
    : Promise.resolve([]);

// For M13: verified practice exercises per skill and rung.
export const countServable = (skillIds: string[]) =>
  skillIds.length
    ? db
        .select({ skillId: exercises.skillId, rung: exercises.rung, n: count() })
        .from(exercises)
        .where(and(inArray(exercises.skillId, skillIds), eq(exercises.status, "verified"), eq(exercises.purpose, "practice")))
        .groupBy(exercises.skillId, exercises.rung)
    : Promise.resolve([]);

export const listTitles = (ids: string[]) =>
  ids.length
    ? db.select({ id: exercises.id, title: exercises.title, skillId: exercises.skillId, rung: exercises.rung }).from(exercises).where(inArray(exercises.id, ids))
    : Promise.resolve([]);
