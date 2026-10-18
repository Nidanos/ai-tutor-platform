import { geminiProvider } from "../../../infrastructure/llm/gemini-provider.js";
import { spentThisMonthInr } from "../../../infrastructure/llm/llm-log.js";
import type { LlmProvider } from "../../../infrastructure/llm/llm-provider.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { startOfIstDay } from "../../../shared/utils/ist.js";
import { getHintContext } from "../../m6_exercises/services/exercises.service.js";
import { latestAttempt } from "../../m7_execution/services/attempts.service.js";
import { lastResult } from "../../m7_execution/services/submissions.service.js";
import * as repo from "../repositories/hints.repository.js";
import { answerHint, GENERIC, HINT_PROMPT_VERSION, hintPrompt, SYSTEM } from "./hint-prompts.js";
import { checkHint } from "./solution-filter.js";

const MODEL = "gemini-3.5-flash-lite"; // ADR-0015
const MAX_OUTPUT_TOKENS = 400;
const LIVE_PER_DAY = 20; // per learner (ADR-0010)
export const MONTHLY_BUDGET_INR = 500; // all learners together (ADR-0010)
const COMPILER_CHARS = 800;

type Task = Awaited<ReturnType<typeof getHintContext>>;
type Hint = { bodyMd: string; source: "live" | "frozen" | "generic" | "answer"; event: repo.HintEvent };
type LastResult = Awaited<ReturnType<typeof lastResult>>;
type SampleRun = { visibility: string; verdict: string; input?: string | null; expectedOutput?: string | null; output?: string | null };

// What the last run said, for the tutor: the verdict, the compiler's message, the failing sample.
// Hidden tests never leave the server.
function describe(result: LastResult) {
  if (!result || !("verdict" in result)) return undefined;
  const lines = [`${result.verdict}: ${result.testsPassed} of ${result.testsTotal} tests passed.`];
  if (result.compileOutput) lines.push(`Compiler:\n${result.compileOutput.slice(0, COMPILER_CHARS)}`);
  const sample = (result.tests as SampleRun[] | undefined)?.find((t) => t.visibility === "sample" && t.verdict !== "AC");
  if (sample) lines.push(`Sample test: input ${sample.input}, expected ${sample.expectedOutput}, got ${sample.output}`);
  return lines.join("\n");
}

// The live tutor (ADR-0010), within the daily and monthly caps. Undefined means "use the frozen hint":
// a cap was hit, Gemini failed, or the filter blocked the reply (logged, FR-M8-04).
async function liveHint(llm: LlmProvider, userId: string, attempt: { id: string }, task: Task, level: number, learnerCode?: string) {
  if ((await repo.liveCallsSince(userId, startOfIstDay())) >= LIVE_PER_DAY) return undefined;
  if ((await spentThisMonthInr()) >= MONTHLY_BUDGET_INR) return undefined;
  try {
    const prompt = hintPrompt(task, level, learnerCode, describe(await lastResult(userId, attempt.id)));
    const { text, callId } = await llm.generate({
      purpose: "hint",
      model: MODEL,
      promptVersion: HINT_PROMPT_VERSION,
      system: SYSTEM,
      prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      ref: { type: "exercise_attempt", id: attempt.id },
    });
    const filterResult = checkHint(text, { reference: task.referenceSolution, starter: task.starterCode, learnerCode, output: task.rung === 1 ? task.firstOutput : undefined });
    const event = { bodyMd: text, llmCallId: callId, filterResult };
    if (!filterResult.passed) {
      await repo.logEvent(attempt.id, level, { kind: "blocked", ...event });
      return undefined;
    }
    return { bodyMd: text, source: "live", event: { kind: "delivered", ...event } } satisfies Hint;
  } catch (err) {
    console.error("Live hint failed, serving the frozen one", err); // the learner still gets a hint
    return undefined;
  }
}

async function storedHint(exerciseId: string, level: number): Promise<Hint> {
  const stored = await repo.findFrozenHint(exerciseId, level);
  return stored
    ? { bodyMd: stored.bodyMd, source: "frozen", event: { kind: "delivered", hintId: stored.id } }
    : { bodyMd: GENERIC[level], source: "generic", event: { kind: "delivered" } };
}

// POST /exercises/:id/hints (UC-5): the next level only, never the ladder (FR-M8-02), and only when
// asked (FR-M8-03), within the attempt's ceiling from the fade stage (FR-M12-02). Level 5 is the
// answer: logged as a bottom-out (FR-M8-05), and the attempt earns no mastery credit (ADR-0004).
export async function requestHint(userId: string, exerciseId: string, learnerCode?: string, llm: LlmProvider = geminiProvider) {
  const task = await getHintContext(exerciseId);
  const attempt = await latestAttempt(userId, exerciseId);
  if (!attempt) throw new AppError(404, "ATTEMPT_NOT_FOUND", "Open the exercise first");
  if (attempt.status !== "active") throw new AppError(409, "ATTEMPT_CLOSED", "This attempt is already finished");

  const level = attempt.hintLevel + 1;
  if (level > attempt.hintCeiling) {
    await repo.logEvent(attempt.id, Math.min(level, 5), { kind: "denied_ceiling" });
    throw new AppError(409, "HINT_LIMIT", "No more hints at this stage. Try one more run.");
  }
  const hint: Hint =
    level === 5
      ? { bodyMd: answerHint(task, task.firstOutput), source: "answer", event: { kind: "bottomed_out" } }
      : ((await liveHint(llm, userId, attempt, task, level, learnerCode)) ?? (await storedHint(task.id, level)));
  if (!(await repo.giveHint(attempt.id, level, hint.event))) {
    throw new AppError(409, "HINT_CHANGED", "A hint was just given; ask again for the next one");
  }
  return { level, ceiling: attempt.hintCeiling, bodyMd: hint.bodyMd, source: hint.source };
}

// For M13: hint use and its sources.
export const hintStats = repo.hintStats;
