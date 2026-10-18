import { z } from "zod";
import type { LlmProvider } from "../../../infrastructure/llm/llm-provider.js";
import { getHintContext } from "../../m6_exercises/services/exercises.service.js";
import * as repo from "../repositories/hints.repository.js";
import { HINT_PROMPT_VERSION, LEVELS } from "./hint-prompts.js";
import { checkHint } from "./solution-filter.js";

// ADR-0005: each exercise's hints for levels 1–4 are written once, checked by the same filter as live
// hints, and frozen; they are the fallback when the live tutor is capped or down. Level 5 is the answer.
const MODEL = "gemini-3.8-flash"; // the larger model for content that is kept (ADR-0010)
const TRIES = 2;
const schema = z.object({ level1: z.string().min(1), level2: z.string().min(1), level3: z.string().min(1), level4: z.string().min(1) });
const { $schema, ...jsonSchema } = z.toJSONSchema(schema); // Gemini wants the schema itself, without the dialect tag

const SYSTEM = `You write the stored hints for one C++ exercise, for a beginner who is stuck and hasn't shown any code.
Write one hint per level, each a single short paragraph (at most 60 words), in Markdown.
Never write the solution, and never copy code from the PRIVATE reference. For a "predict the output" task, never state the output.`;

export type FreezeResult = { status: "frozen" | "skipped" | "already"; reason?: string };

export async function freezeHints(exerciseId: string, llm: LlmProvider): Promise<FreezeResult> {
  if ((await repo.storedLevels(exerciseId)).length) return { status: "already" };
  const task = await getHintContext(exerciseId);
  const predict = task.rung === 1;
  const prompt = [
    `TASK (${predict ? "predict the output of this program" : "write the code"}):\n${task.promptMd}`,
    `${predict ? "PROGRAM" : "STARTER CODE"}:\n${task.starterCode}`,
    `PRIVATE REFERENCE (never reveal):\n${task.referenceSolution}`,
    "LEVELS (\"their code\" means the starter code):",
    ...[1, 2, 3, 4].map((l) => `level${l}: ${LEVELS[l]}`),
  ].join("\n\n");

  let reason = "";
  for (let i = 0; i < TRIES; i++) {
    // Kept content: counted against the generation budget, not the live-hint one (ADR-0016).
    const { text } = await llm.generate({ purpose: "exercise_generation", model: MODEL, promptVersion: HINT_PROMPT_VERSION, system: SYSTEM, prompt, maxOutputTokens: 1200, thinking: "low", jsonSchema, ref: { type: "exercise_hints", id: exerciseId } });
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      reason = "the reply didn't match the schema";
      continue;
    }
    const hints = [parsed.data.level1, parsed.data.level2, parsed.data.level3, parsed.data.level4];
    const leaky = hints.findIndex((h) => !checkHint(h, { reference: task.referenceSolution, starter: task.starterCode, output: predict ? task.firstOutput : undefined }).passed);
    if (leaky >= 0) {
      reason = `level ${leaky + 1} gave too much away`;
      continue;
    }
    await repo.insertFrozenHints(hints.map((bodyMd, j) => ({ exerciseId, level: j + 1, bodyMd, source: "pregenerated" as const, filterPassed: true, model: MODEL })));
    return { status: "frozen" };
  }
  return { status: "skipped", reason };
}
