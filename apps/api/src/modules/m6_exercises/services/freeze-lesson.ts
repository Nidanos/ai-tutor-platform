import type { z } from "zod";
import { e2bProvider } from "../../../infrastructure/sandbox/e2b-provider.js";
import type { SandboxProvider } from "../../../infrastructure/sandbox/sandbox-provider.js";
import { leaksSolution } from "../../m8_socratic/services/solution-filter.js";
import * as exercisesRepo from "../repositories/exercises.repository.js";
import * as repo from "../repositories/lessons.repository.js";
import { type LessonDraft, lessonDraft, type Level } from "./lesson-draft.js";
import { verifyContent } from "./verify-exercise.js";

export type LessonKey = { skillId: string; languageCode: string; level: Level };
export type LessonResult = { ok: true; lessonId: string } | { ok: false; reason: string };
export type Solutions = Awaited<ReturnType<typeof exercisesRepo.listSolutionsOfSkill>>;
export const HAND_WRITTEN = "hand-written";

export const draftIssues = (error: z.ZodError) => error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ").slice(0, 500);

// A program in the lesson must print exactly what the lesson says: run in the sandbox as a rung-1 exercise.
async function problemWith(code: string, output: string, languageCode: string, sandbox: SandboxProvider) {
  const check = { rung: 1, languageCode, harnessCode: null, referenceSolution: code, starterCode: "", tests: [{ seq: 1, expectedOutput: output }], limits: exercisesRepo.DEFAULT_LIMITS };
  const verification = await verifyContent(check, sandbox);
  if (verification.ok) return undefined;
  return verification.stage === "compile" ? "doesn't compile" : "doesn't print exactly the output it states";
}

// The gates every lesson passes before it is frozen, written by Gemini or by hand (ADR-0019): no practice
// exercise given away, then both programs proven in the sandbox. Undefined when it passes, else why not.
export async function lessonProblem(draft: LessonDraft, solutions: Solutions, languageCode: string, sandbox: SandboxProvider) {
  const whole = [draft.explanationMd, draft.example.code, draft.example.walkthroughMd, draft.mistakesMd, draft.check.code, draft.check.explanationMd].join("\n");
  const leaked = solutions.find((s) => leaksSolution(whole, { reference: s.reference, starter: s.starter, output: s.rung === 1 ? (s.firstOutput ?? undefined) : undefined }));
  if (leaked) return `it gives away the practice exercise "${leaked.title}"`;
  const example = await problemWith(draft.example.code, draft.example.output, languageCode, sandbox);
  if (example) return `the example program ${example}`;
  const check = await problemWith(draft.check.code, draft.check.output, languageCode, sandbox);
  if (check) return `the check program ${check}`;
  return undefined;
}

export const freezeLesson = (key: LessonKey, { explanationMd, diagram, example, mistakesMd, check }: LessonDraft, source: { model: string; promptVersion: string; llmCallId?: number }) =>
  repo.insertLesson({
    ...key,
    explanationMd,
    diagram: diagram.trim(),
    exampleCode: example.code,
    exampleOutput: example.output,
    exampleMd: example.walkthroughMd,
    mistakesMd,
    checkCode: check.code,
    checkOutput: check.output,
    checkMd: check.explanationMd,
    ...source,
  });

// A hand-written lesson passes the same gates as a generated one; its author is its fact-check.
export async function addHandWrittenLesson(key: LessonKey, draft: LessonDraft, sandbox: SandboxProvider = e2bProvider): Promise<LessonResult> {
  const parsed = lessonDraft.safeParse(draft);
  if (!parsed.success) return { ok: false, reason: draftIssues(parsed.error) };
  const problem = await lessonProblem(parsed.data, await exercisesRepo.listSolutionsOfSkill(key.skillId, key.languageCode), key.languageCode, sandbox);
  if (problem) return { ok: false, reason: problem };
  return { ok: true, lessonId: await freezeLesson(key, parsed.data, { model: HAND_WRITTEN, promptVersion: HAND_WRITTEN }) };
}

// Any lesson at this level, by hand or by any prompt version: the scripts never write a level twice.
export const hasLesson = repo.hasLesson;
