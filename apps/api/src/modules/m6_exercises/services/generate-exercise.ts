import { harnessFor } from "../../../infrastructure/database/seed/seed-exercises.js";
import { geminiProvider } from "../../../infrastructure/llm/gemini-provider.js";
import { spentThisMonthInr } from "../../../infrastructure/llm/llm-log.js";
import type { LlmProvider } from "../../../infrastructure/llm/llm-provider.js";
import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { getSkill, getSkillGraph, prerequisitesOf } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/exercises.repository.js";
import { draftSchema, GENERATION_PROMPT_VERSION, type GenerationContext, generationPrompt, jsonSchemaFor, SYSTEM, toTemplate } from "./exercise-draft.js";
import { verifyContent } from "./verify-exercise.js";

// ADR-0016 (FR-M6-01..04). One try per model: Flash twice, then Pro once (ADR-0010).
export const GENERATION_MODELS = ["gemini-3.8-flash", "gemini-3.8-flash", "gemini-3.1-pro-preview"];
export const GENERATION_BUDGET_INR = 300; // per month, kept apart from the live-hint budget
const MAX_OUTPUT_TOKENS = 6000;

type Job = NonNullable<Awaited<ReturnType<typeof repo.findJob>>>;
type Stage = Parameters<typeof repo.logFailure>[2];
type TryResult = { exerciseId: string } | { stage: Stage; reason: string };

const message = (err: unknown) => String(err).slice(0, 500);

// One try: write a draft, check its shape, prove it in the sandbox, store it verified.
async function tryOnce(job: Job, context: GenerationContext, model: string, llm: LlmProvider, sandbox: SandboxProvider): Promise<TryResult> {
  let text: string;
  try {
    ({ text } = await llm.generate({
      purpose: "exercise_generation",
      model,
      promptVersion: GENERATION_PROMPT_VERSION,
      system: SYSTEM,
      prompt: generationPrompt(context),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinking: "low",
      jsonSchema: jsonSchemaFor(job.rung),
      ref: { type: "generation_job", id: job.id },
    }));
  } catch (err) {
    return { stage: "llm", reason: message(err) };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { stage: "schema", reason: "the reply wasn't valid JSON" };
  }
  const parsed = draftSchema(job.rung).safeParse(json);
  if (!parsed.success) return { stage: "schema", reason: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ").slice(0, 500) };

  await repo.updateJob(job.id, { status: "verifying" });
  const template = toTemplate(parsed.data, job.rung, context.skill.slug);
  const harnessCode = harnessFor(template);
  try {
    const verification = await verifyContent(
      {
        rung: job.rung,
        languageCode: job.languageCode,
        harnessCode,
        referenceSolution: template.reference,
        starterCode: template.starterCode,
        tests: template.cases.map((c, i) => ({ seq: i + 1, expectedOutput: c.expected })),
        limits: repo.DEFAULT_LIMITS,
        wrongSolutions: "wrongSolutions" in parsed.data ? parsed.data.wrongSolutions : [],
      },
      sandbox,
    );
    if (!verification.ok) return { stage: verification.stage, reason: verification.reason };
  } catch (err) {
    return { stage: "sandbox", reason: message(err) };
  }

  const exerciseId = await repo.insertGenerated(template, { skillId: job.skillId, variantSeed: job.variantSeed, harnessCode });
  return exerciseId ? { exerciseId } : { stage: "schema", reason: "an exercise with this content key already exists" };
}

// The queue worker's job. Returns the new exercise's id, or undefined when the job fell back to the
// hand-written bank (FR-M6-03). Every failed try is logged with its stage (FR-M6-04).
export async function runGeneration(jobId: string, llm: LlmProvider = geminiProvider, sandbox: SandboxProvider = e2bProvider) {
  const job = await repo.findJob(jobId);
  if (!job || !["queued", "generating", "verifying"].includes(job.status)) return undefined; // gone, or a duplicate run

  const skill = await getSkill(job.skillId);
  const graph = await getSkillGraph(skill.courseId, job.languageCode);
  let context: GenerationContext = {
    skill: { slug: skill.slug, name: skill.name, description: skill.description },
    prerequisites: prerequisitesOf(graph, skill.id).map((s) => s.name),
    rung: job.rung,
    existingTitles: await repo.listTitlesForSkill(skill.id),
  };
  await repo.updateJob(job.id, { status: "generating", startedAt: new Date() });

  for (let tryNo = job.tries + 1; tryNo <= GENERATION_MODELS.length; tryNo++) {
    if ((await spentThisMonthInr("exercise_generation")) >= GENERATION_BUDGET_INR) {
      await repo.logFailure(job.id, tryNo, "llm", { reason: "this month's generation budget is spent" });
      break;
    }
    const model = GENERATION_MODELS[tryNo - 1];
    await repo.updateJob(job.id, { status: "generating", tries: tryNo, model });
    const result = await tryOnce(job, context, model, llm, sandbox);
    if ("exerciseId" in result) {
      await repo.updateJob(job.id, { status: "succeeded", exerciseId: result.exerciseId, finishedAt: new Date() });
      return result.exerciseId;
    }
    await repo.logFailure(job.id, tryNo, result.stage, { reason: result.reason });
    context = { ...context, previousFailure: result.reason }; // the next try is told what to fix
  }

  const fallback = await repo.findTemplateFallback(job.skillId, job.languageCode, job.rung);
  await repo.updateJob(job.id, { status: "fell_back", fallbackExerciseId: fallback?.id ?? null, finishedAt: new Date() });
  return undefined;
}
