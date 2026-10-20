import { geminiProvider, geminiReady } from "../../../infrastructure/llm/gemini-provider.js";
import { spentThisMonthInr } from "../../../infrastructure/llm/llm-log.js";
import type { LlmProvider } from "../../../infrastructure/llm/llm-provider.js";
import { getSkill, getSkillGraph, getSkillsWithCourse } from "../../m2_skills/services/skills.service.js";
import { effectiveStates, getSkillMastery } from "../../m4_mastery/services/mastery-read.service.js";
import { exerciseIdsOfSkill } from "../../m6_exercises/services/exercises.service.js";
import { levelFor } from "../../m6_exercises/services/lesson-draft.js";
import { recentResults } from "../../m7_execution/services/submissions.service.js";
import * as repo from "../repositories/lesson-notes.repository.js";
import { LIVE_MODEL, LIVE_PER_DAY, liveCallsToday, MONTHLY_BUDGET_INR } from "./hints.service.js";

export const NOTE_PROMPT_VERSION = "note-v1";
const MAX_OUTPUT_TOKENS = 300;
const MAX_WORDS = 100;
const RECENT = 5;

const SYSTEM = `You are a warm, encouraging programming tutor. Write a short personal note (2–4 sentences, at most 80 words) for a learner about to read a lesson.
Say what their scores and recent results suggest, and what to pay most attention to in the lesson. If a prerequisite is weak, suggest a quick look back at it first.
Plain sentences only: no code, no solutions, no lists, no greeting by name.`;

const pct = (x: number) => `${Math.round(x * 100)}%`;

// What the note can be based on, all through the modules that own it: the level, recent results on the
// skill (verdicts and test counts, never code) and weak prerequisites. Undefined: nothing personal yet.
async function promptFor(userId: string, skillId: string, languageCode: string, mastery: Awaited<ReturnType<typeof getSkillMastery>>) {
  const skill = await getSkill(skillId);
  const [graph, states, results] = await Promise.all([
    getSkillGraph(skill.courseId, languageCode),
    effectiveStates(userId, languageCode),
    exerciseIdsOfSkill(skillId, languageCode).then((ids) => recentResults(userId, ids, RECENT)),
  ]);
  const needs = graph.find((s) => s.id === skillId)?.prerequisites ?? [];
  const weak = needs.filter((p) => !states.get(p.id)?.cleared && (states.get(p.id)?.writing ?? 0) < p.minMastery);
  if (!results.length && !weak.length) return undefined;

  const names = new Map((await getSkillsWithCourse(weak.map((p) => p.id))).map((s) => [s.id, s.name]));
  const level = levelFor({ reading: mastery.reading.effective, writing: mastery.writing.effective, cleared: mastery.clearedAt !== null });
  return [
    `SKILL: ${skill.name}`,
    `LEVEL: ${level} (reading ${pct(mastery.reading.effective)}, writing ${pct(mastery.writing.effective)})`,
    results.length ? `RECENT RESULTS ON THIS SKILL, newest first: ${results.map((r) => `${r.verdict} ${r.testsPassed}/${r.testsTotal}`).join(", ")}` : "",
    weak.length ? `WEAK PREREQUISITES: ${weak.map((p) => `${names.get(p.id)} (writing ${pct(states.get(p.id)?.writing ?? 0)}, needs ${pct(p.minMastery)})`).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// No code (the learner must never be handed one), and short.
const acceptable = (text: string) => text.trim() !== "" && !text.includes("```") && text.trim().split(/\s+/).length <= MAX_WORDS;

// POST /lessons/:skillId/note (ADR-0019): a few sentences for this learner over the frozen lesson. It
// carries learner data, so only with billing on, inside the live tutor's limits. Reused until the
// learner practises the skill again. Null when there's nothing personal to say, or no live call.
// A rejected reply is stored empty: it counts towards the daily limit and isn't paid for twice.
export async function lessonNote(userId: string, skillId: string, languageCode: string, llm: LlmProvider = geminiProvider) {
  const mastery = await getSkillMastery(userId, skillId, languageCode);
  const latest = await repo.latestNote(userId, skillId, languageCode);
  if (latest && latest.attemptsSeen === mastery.attemptCount) return latest.bodyMd ? { bodyMd: latest.bodyMd } : null;
  if (!geminiReady() || (await liveCallsToday(userId)) >= LIVE_PER_DAY || (await spentThisMonthInr("hint")) >= MONTHLY_BUDGET_INR) return null;

  try {
    const prompt = await promptFor(userId, skillId, languageCode, mastery);
    if (!prompt) return null;
    const { text, callId } = await llm.generate({
      purpose: "hint", // live tutor output: counted in its monthly budget
      model: LIVE_MODEL,
      promptVersion: NOTE_PROMPT_VERSION,
      system: SYSTEM,
      prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      ref: { type: "lesson_note", id: skillId },
    });
    const bodyMd = acceptable(text) ? text.trim() : "";
    await repo.insertNote({ userId, skillId, languageCode, bodyMd, attemptsSeen: mastery.attemptCount, llmCallId: callId });
    return bodyMd ? { bodyMd } : null;
  } catch (err) {
    console.error("Lesson note failed", err); // the lesson still opens, without a note
    return null;
  }
}

// For M1: the learner's own notes (DPDP access).
export const learnerNotes = repo.learnerNotes;
