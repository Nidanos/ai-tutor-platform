import { geminiReady } from "../../../infrastructure/llm/gemini-provider.js";
import { spentThisMonthInr } from "../../../infrastructure/llm/llm-log.js";
import { enqueueGeneration } from "../../../infrastructure/queue/generation-queue.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { getSkill } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/exercises.repository.js";
import { GENERATION_PROMPT_VERSION } from "./exercise-draft.js";
import { GENERATION_BUDGET_INR, GENERATION_MODELS } from "./generate-exercise.js";

const FALLBACK_COOLDOWN_MS = 24 * 60 * 60_000; // a skill and rung that just failed isn't retried automatically for a day

const budgetSpent = async () => (await spentThisMonthInr("exercise_generation")) >= GENERATION_BUDGET_INR;

// The skill and rung's active job, or a new one. Queued again when found still queued: that heals a
// failed first enqueue, and the queue's job id prevents doubles.
async function createJob(key: repo.JobKey, trigger: "pregen" | "on_demand", requestedBy?: string) {
  const job =
    (await repo.findActiveJob(key)) ??
    (await repo.insertJob({
      ...key,
      variantSeed: await repo.nextVariantSeed(key),
      trigger,
      requestedBy,
      model: GENERATION_MODELS[0],
      promptVersion: GENERATION_PROMPT_VERSION,
    }));
  if (job.status === "queued") await enqueueGeneration(job.id);
  return job;
}

// POST /exercises/generate (admins and authors): one new exercise for this skill and rung.
export async function requestGeneration(key: repo.JobKey, requestedBy: string) {
  if (!geminiReady()) throw new AppError(503, "GENERATION_UNAVAILABLE", "Exercise generation is off until Gemini billing is active");
  if (await budgetSpent()) throw new AppError(503, "GENERATION_BUDGET_REACHED", "This month's generation budget is spent");
  return jobView(await createJob(key, "pregen", requestedBy));
}

// For M5: a skill and rung with nothing to serve gets an exercise generated in the background.
// Quiet by design: it never fails or slows the learner's request beyond a few queries.
export async function queueMissingExercise(key: repo.JobKey) {
  try {
    if (!geminiReady() || (await repo.findActiveJob(key)) || (await budgetSpent())) return;
    const failedAt = await repo.lastFallbackAt(key);
    if (failedAt && Date.now() - failedAt.getTime() < FALLBACK_COOLDOWN_MS) return;
    await createJob(key, "on_demand");
  } catch (err) {
    console.error("Couldn't queue a missing exercise", err);
  }
}

async function jobView(job: NonNullable<Awaited<ReturnType<typeof repo.findJob>>>) {
  const { slug, name } = await getSkill(job.skillId);
  const failures = await repo.listFailures(job.id);
  return {
    id: job.id,
    skill: { slug, name },
    rung: job.rung,
    status: job.status,
    trigger: job.trigger,
    tries: job.tries,
    model: job.model,
    exerciseId: job.exerciseId,
    fallbackExerciseId: job.fallbackExerciseId,
    failures: failures.map((f) => ({ tryNo: f.tryNo, stage: f.stage, reason: (f.details as { reason?: string }).reason ?? null })),
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
  };
}

// GET /exercises/generation/:jobId
export async function getGenerationJob(id: string) {
  const job = await repo.findJob(id);
  if (!job) throw new AppError(404, "GENERATION_JOB_NOT_FOUND", "No such generation job");
  return jobView(job);
}
