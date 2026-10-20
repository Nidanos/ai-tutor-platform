import { geminiProvider } from "../../../infrastructure/llm/gemini-provider.js";
import { spentThisMonthInr } from "../../../infrastructure/llm/llm-log.js";
import type { LlmProvider, LlmResult } from "../../../infrastructure/llm/llm-provider.js";
import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { getAncestorNames, getSkill } from "../../m2_skills/services/skills.service.js";
import * as exercisesRepo from "../repositories/exercises.repository.js";
import { draftIssues, freezeLesson, type LessonResult, lessonProblem, type Solutions } from "./freeze-lesson.js";
import { GENERATION_MODELS } from "./generate-exercise.js";
import {
  LESSON_PROMPT_VERSION,
  LESSON_SYSTEM,
  type LessonContext,
  type LessonDraft,
  lessonDraft,
  lessonJsonSchema,
  lessonPrompt,
  lessonReview,
  type Level,
  REVIEW_SYSTEM,
  reviewJsonSchema,
  reviewPrompt,
} from "./lesson-draft.js";

export const LESSON_BUDGET_INR = 300; // per month, apart from the live tutor's and generation's (ADR-0019)
const MAX_OUTPUT_TOKENS = 8000;
const TIMEOUT_MS = 120_000;

type Options = { llm?: LlmProvider; sandbox?: SandboxProvider; allowFreeTier?: boolean };
type Ask = (system: string, prompt: string, jsonSchema: object) => Promise<LlmResult>;
type Checked = { reason: string } | { draft: LessonDraft };

// The draft, if it passes: its shape, then the gates every lesson passes. Otherwise why not, for the next try.
async function rejection(text: string, solutions: Solutions, languageCode: string, sandbox: SandboxProvider): Promise<Checked> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { reason: "the reply wasn't valid JSON" };
  }
  const parsed = lessonDraft.safeParse(json);
  if (!parsed.success) return { reason: draftIssues(parsed.error) };
  const problem = await lessonProblem(parsed.data, solutions, languageCode, sandbox);
  return problem ? { reason: problem } : { draft: parsed.data };
}

// Then the fact-check: the same model reads the draft again, claim by claim. Anything false sends it
// back with what is true; a fact-check that fails to run doesn't pass it either.
async function factCheck(draft: LessonDraft, skillName: string, level: Level, ask: Ask): Promise<Checked> {
  try {
    const { problems } = lessonReview.parse(JSON.parse((await ask(REVIEW_SYSTEM, reviewPrompt(skillName, level, draft), reviewJsonSchema)).text));
    if (!problems.length) return { draft };
    return { reason: `it states something false: ${problems.map((p) => `"${p.claim}" (in fact: ${p.truth})`).join("; ")}`.slice(0, 1000) };
  } catch (err) {
    return { reason: `the fact-check failed: ${String(err).slice(0, 300)}` };
  }
}

// Writes, checks and freezes one lesson (ADR-0019), with the same tries as exercise generation:
// Flash twice, then Pro, each told why the last one was rejected. Each try is a draft, then its fact-check.
export async function generateLesson(skillId: string, languageCode: string, level: Level, options: Options = {}): Promise<LessonResult> {
  const { llm = geminiProvider, sandbox = e2bProvider, allowFreeTier } = options;
  const [skill, known, solutions] = await Promise.all([getSkill(skillId), getAncestorNames(skillId, languageCode), exercisesRepo.listSolutionsOfSkill(skillId, languageCode)]);
  let context: LessonContext = { skill, known, level, exerciseTitles: solutions.map((s) => s.title) };
  let reason = "no tries made";

  for (const model of GENERATION_MODELS) {
    if ((await spentThisMonthInr("explanation")) >= LESSON_BUDGET_INR) return { ok: false, reason: "this month's lesson budget is spent" };
    const ask: Ask = (system, prompt, jsonSchema) =>
      llm.generate({
        purpose: "explanation",
        model,
        promptVersion: LESSON_PROMPT_VERSION,
        system,
        prompt,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        thinking: "low",
        jsonSchema,
        ref: { type: "lesson", id: skillId },
        timeoutMs: TIMEOUT_MS,
        allowFreeTier,
      });
    let reply: LlmResult;
    try {
      reply = await ask(LESSON_SYSTEM, lessonPrompt(context), lessonJsonSchema);
    } catch (err) {
      reason = String(err).slice(0, 500);
      continue;
    }
    const drafted = await rejection(reply.text, solutions, languageCode, sandbox);
    const checked = "draft" in drafted ? await factCheck(drafted.draft, skill.name, level, ask) : drafted;
    if ("draft" in checked) {
      const lessonId = await freezeLesson({ skillId, languageCode, level }, checked.draft, { model, promptVersion: LESSON_PROMPT_VERSION, llmCallId: reply.callId });
      return { ok: true, lessonId };
    }
    reason = checked.reason;
    context = { ...context, previousFailure: reason };
  }
  return { ok: false, reason };
}
