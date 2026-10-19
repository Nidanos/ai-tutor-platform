import { and, asc, count, eq, gte, inArray, max } from "drizzle-orm";
import { countWhere } from "../../../infrastructure/database/aggregates.js";
import { db, type Tx } from "../../../infrastructure/database/index.js";
import { exercises, exerciseSecrets, exerciseTests, generationFailures, generationJobs } from "../../../infrastructure/database/schema/index.js";
import type { ExerciseTemplate } from "../../../infrastructure/database/seed/cpp-templates.js";
import { TOOLCHAINS } from "../../m7_execution/services/toolchains.js";

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

// Server-only, for M8: the task, the starter, the reference and the first expected output.
export async function findForHints(id: string) {
  const [exercise] = await db
    .select({
      id: exercises.id,
      rung: exercises.rung,
      promptMd: exercises.promptMd,
      starterCode: exercises.starterCode,
      referenceSolution: exerciseSecrets.referenceSolution,
    })
    .from(exercises)
    .innerJoin(exerciseSecrets, eq(exerciseSecrets.exerciseId, exercises.id))
    .where(and(eq(exercises.id, id), eq(exercises.status, "verified"), eq(exercises.purpose, "practice")));
  if (!exercise) return undefined;
  const [first] = await db.select({ expectedOutput: exerciseTests.expectedOutput }).from(exerciseTests).where(eq(exerciseTests.exerciseId, id)).orderBy(asc(exerciseTests.seq)).limit(1);
  return { ...exercise, firstOutput: first?.expectedOutput ?? "" };
}

export const listPracticeIds = async () =>
  (await db.select({ id: exercises.id }).from(exercises).where(and(eq(exercises.status, "verified"), eq(exercises.purpose, "practice")))).map((e) => e.id);

export const DEFAULT_LIMITS = { timeLimitMs: 2000, memoryLimitMb: 256 }; // ADR-0003

type NewExercise = Pick<typeof exercises.$inferInsert, "skillId" | "variantSeed" | "purpose" | "source" | "status"> & { harnessCode: string | null };

// One exercise with its secret half and its tests, saved together. Undefined if the content key exists.
export async function insertExercise(tx: Tx, t: ExerciseTemplate, { harnessCode, ...row }: NewExercise) {
  const [created] = await tx
    .insert(exercises)
    .values({
      ...row,
      languageCode: "cpp",
      rung: t.rung,
      contentVersion: TOOLCHAINS.cpp.version,
      title: t.title,
      promptMd: t.promptMd,
      starterCode: t.starterCode,
      functionSignature: t.functionSignature ?? null,
      verifiedAt: row.status === "verified" ? new Date() : null,
      ...DEFAULT_LIMITS,
    })
    .onConflictDoNothing()
    .returning({ id: exercises.id });
  if (!created) return undefined;
  await tx.insert(exerciseSecrets).values({ exerciseId: created.id, harnessCode, referenceSolution: t.reference });
  await tx.insert(exerciseTests).values(
    t.cases.map((c, i) => ({
      exerciseId: created.id,
      seq: i + 1,
      name: i === 0 ? "Example" : `Test ${i + 1}`,
      size: "small" as const,
      visibility: i === 0 ? ("sample" as const) : ("hidden" as const),
      input: c.args || null,
      expectedOutput: c.expected,
    })),
  );
  return created.id;
}

// Generated exercises are verified before they are stored, so they arrive ready to serve.
export const insertGenerated = (t: ExerciseTemplate, row: Pick<NewExercise, "skillId" | "variantSeed" | "harnessCode">) =>
  db.transaction((tx) => insertExercise(tx, t, { ...row, purpose: "practice", source: "generated", status: "verified" }));

export const listTitlesForSkill = async (skillId: string) =>
  (await db.select({ title: exercises.title }).from(exercises).where(and(eq(exercises.skillId, skillId), eq(exercises.purpose, "practice")))).map((e) => e.title);

// FR-M6-03: a hand-written exercise for the same skill and rung, when generation gives up.
export const findTemplateFallback = async (skillId: string, languageCode: string, rung: number) =>
  (
    await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(
        and(
          eq(exercises.skillId, skillId),
          eq(exercises.languageCode, languageCode),
          eq(exercises.rung, rung),
          eq(exercises.status, "verified"),
          eq(exercises.purpose, "practice"),
          eq(exercises.source, "template"),
        ),
      )
      .limit(1)
  )[0];

// Generation jobs (ADR-0016).
export type JobKey = { skillId: string; languageCode: string; rung: number };
const ACTIVE = ["queued", "generating", "verifying"] as const;
const GENERATED_SEED_BASE = 1000; // templates use 1–99 and placement items 100+; generated variants never meet them
const jobKey = (k: JobKey) => and(eq(generationJobs.skillId, k.skillId), eq(generationJobs.languageCode, k.languageCode), eq(generationJobs.rung, k.rung));

export const findJob = async (id: string) => (await db.select().from(generationJobs).where(eq(generationJobs.id, id)))[0];
export const findActiveJob = async (k: JobKey) => (await db.select().from(generationJobs).where(and(jobKey(k), inArray(generationJobs.status, ACTIVE))))[0];
export const lastFallbackAt = async (k: JobKey) =>
  (await db.select({ at: max(generationJobs.finishedAt) }).from(generationJobs).where(and(jobKey(k), eq(generationJobs.status, "fell_back"))))[0].at;

// Each job gets a variant number no exercise or earlier job of this skill and rung has used.
export async function nextVariantSeed(k: JobKey) {
  const [{ job }] = await db.select({ job: max(generationJobs.variantSeed) }).from(generationJobs).where(jobKey(k));
  const [{ exercise }] = await db
    .select({ exercise: max(exercises.variantSeed) })
    .from(exercises)
    .where(and(eq(exercises.skillId, k.skillId), eq(exercises.languageCode, k.languageCode), eq(exercises.rung, k.rung), eq(exercises.source, "generated")));
  return Math.max(GENERATED_SEED_BASE - 1, job ?? 0, exercise ?? 0) + 1;
}

// One active job per skill and rung (partial unique index): a second request gets the first job back.
export async function insertJob(values: typeof generationJobs.$inferInsert) {
  await db.insert(generationJobs).values(values).onConflictDoNothing();
  return (await findActiveJob(values))!;
}

export const updateJob = (id: string, values: Partial<typeof generationJobs.$inferInsert>) => db.update(generationJobs).set(values).where(eq(generationJobs.id, id));

export const logFailure = (generationJobId: string, tryNo: number, stage: (typeof generationFailures.$inferInsert)["stage"], details: object) =>
  db.insert(generationFailures).values({ generationJobId, tryNo, stage, details });

export const listFailures = (generationJobId: string) =>
  db
    .select({ tryNo: generationFailures.tryNo, stage: generationFailures.stage, details: generationFailures.details })
    .from(generationFailures)
    .where(eq(generationFailures.generationJobId, generationJobId))
    .orderBy(asc(generationFailures.tryNo));

// For M13 (FR-M13-03): generation outcomes in the window per skill and rung, and why tries failed.
export async function generationStats(since: Date) {
  const inWindow = gte(generationJobs.createdAt, since);
  const bySkill = await db
    .select({
      skillId: generationJobs.skillId,
      rung: generationJobs.rung,
      succeeded: countWhere(eq(generationJobs.status, "succeeded")),
      fellBack: countWhere(eq(generationJobs.status, "fell_back")),
      pending: countWhere(inArray(generationJobs.status, ACTIVE)),
    })
    .from(generationJobs)
    .where(inWindow)
    .groupBy(generationJobs.skillId, generationJobs.rung);
  const failures = await db
    .select({ stage: generationFailures.stage, n: count() })
    .from(generationFailures)
    .innerJoin(generationJobs, eq(generationJobs.id, generationFailures.generationJobId))
    .where(inWindow)
    .groupBy(generationFailures.stage);
  return { bySkill, failures };
}

// Every exercise of a skill in one language (practice and placement), whatever its status.
export const exerciseIdsOfSkill = async (skillId: string, languageCode: string) =>
  (await db.select({ id: exercises.id }).from(exercises).where(and(eq(exercises.skillId, skillId), eq(exercises.languageCode, languageCode)))).map((e) => e.id);
