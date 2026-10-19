import { AppError } from "../../../shared/errors/app-error.js";
import { getCourse, getSkillGraph } from "../../m2_skills/services/skills.service.js";
import { effectiveStates } from "../../m4_mastery/services/mastery-read.service.js";
import { seedFromDiagnostic } from "../../m4_mastery/services/mastery.service.js";
import { getRunnableExercise, verifiedIds } from "../../m6_exercises/services/exercises.service.js";
import { sameOutput } from "../../m7_execution/services/judge.js";
import { getResult, submitDiagnostic } from "../../m7_execution/services/submissions.service.js";
import { startAtLastStage } from "../../m12_scaffolding/services/scaffolding.service.js";
import * as repo from "../repositories/diagnostic.repository.js";
import { ensureEnrollment } from "./enrollments.service.js";
import { estimate, inOrder, nextItem, PLACEMENT_VERSION } from "./placement.js";

const MAX_ATTEMPTS = 3; // a first try and two retakes (FR-M3-03); each costs at most 7 sandbox runs
const GRADING_WAIT_MS = 120_000; // a code task still not run after this counts as unobserved, so complete always ends
const RETRY_AFTER_MS = 5_000; // at most 24 polls in the grading wait: well inside the rate limit

export type StartInput = { course: string; language: string; retake: boolean };
export type AnswerInput = { itemId: string } & ({ answer: string } | { dontKnow: true });

type Attempt = repo.DiagnosticAttempt;
type State = Awaited<ReturnType<typeof load>>;
type Row = State["rows"][number];

const notFound = () => new AppError(404, "DIAGNOSTIC_NOT_FOUND", "No such placement test");

// Everything the placement rules need, read through the modules that own it. Only items whose
// exercise passed sandbox verification are ever asked.
async function load(userId: string, courseId: string, languageCode: string, diagnosticId?: string) {
  const [skills, mastery] = await Promise.all([getSkillGraph(courseId, languageCode), effectiveStates(userId, languageCode)]);
  const listed = await repo.listItems(skills.map((s) => s.id), languageCode);
  const verified = await verifiedIds(listed.map((i) => i.exerciseId!));
  return {
    skills,
    items: listed.filter((i) => verified.has(i.exerciseId!)),
    rows: diagnosticId ? await repo.listResponses(diagnosticId) : [],
    cleared: new Set(skills.filter((s) => mastery.get(s.id)?.cleared).map((s) => s.id)),
  };
}

const placementOf = (state: State, rows = state.rows) => ({
  ...state,
  responses: rows.map((r) => ({ itemId: r.itemId, isCorrect: r.isCorrect, dontKnow: (r.answer as { dontKnow?: boolean }).dontKnow === true })),
});

// The current question shows the program or the task, never its key, tests or whether earlier answers were right.
function inProgressView(attempt: Attempt, state: State) {
  const item = nextItem(placementOf(state));
  const skill = item && state.skills.find((s) => s.id === item.skillId)!;
  return {
    diagnosticId: attempt.id,
    attemptNo: attempt.attemptNo,
    status: "in_progress" as const,
    answered: state.rows.length,
    question: item && {
      itemId: item.id,
      dimension: item.dimension,
      skill: { slug: skill!.slug, name: skill!.name },
      promptMd: item.promptMd,
      ...(item.payload as Record<string, unknown>),
    },
  };
}

async function completedView(attempt: Attempt) {
  const [results, skills] = await Promise.all([repo.listResults(attempt.id), getSkillGraph(attempt.courseId, attempt.languageCode)]);
  const resultOf = new Map(results.map((r) => [r.skillId, r]));
  return {
    diagnosticId: attempt.id,
    attemptNo: attempt.attemptNo,
    status: "completed" as const,
    completedAt: attempt.completedAt,
    results: inOrder(skills)
      .filter((s) => resultOf.has(s.id))
      .map((s) => {
        const { estReading, estWriting, confidence } = resultOf.get(s.id)!;
        return { skill: { id: s.id, slug: s.slug, name: s.name }, estReading, estWriting, confidence };
      }),
  };
}

// POST /diagnostic/start: resumes the test in progress, shows the last result, or (with retake) starts a new one.
export async function start(userId: string, { course: courseSlug, language, retake }: StartInput) {
  const course = await getCourse(courseSlug, language);
  const { id: enrollmentId } = await ensureEnrollment(userId, course.id, language);
  const latest = await repo.findLatest(enrollmentId);
  if (latest?.status === "in_progress") return inProgressView(latest, await load(userId, course.id, language, latest.id));
  if (latest && !retake) return completedView(latest);
  if (latest && latest.attemptNo >= MAX_ATTEMPTS) throw new AppError(409, "DIAGNOSTIC_LIMIT", "No placement retakes left for this course");

  const state = await load(userId, course.id, language);
  if (!state.items.length) throw new AppError(503, "DIAGNOSTIC_UNAVAILABLE", "The placement test isn't ready yet");
  const attempt = await repo.createAttempt(enrollmentId, (latest?.attemptNo ?? 0) + 1);
  return inProgressView(attempt, { ...state, rows: await repo.listResponses(attempt.id) });
}

async function ownAttempt(userId: string, diagnosticId: string) {
  const attempt = await repo.findOwn(diagnosticId, userId);
  if (!attempt) throw notFound();
  return attempt;
}

// POST /diagnostic/:id/answers: only the current question can be answered; answering it again is a
// replay that changes nothing. The reply carries the next question.
export async function answer(userId: string, diagnosticId: string, input: AnswerInput) {
  const attempt = await ownAttempt(userId, diagnosticId);
  if (attempt.status !== "in_progress") throw new AppError(409, "DIAGNOSTIC_CLOSED", "This placement test is finished");
  const state = await load(userId, attempt.courseId, attempt.languageCode, attempt.id);
  if (state.rows.some((r) => r.itemId === input.itemId)) return inProgressView(attempt, state);

  const item = nextItem(placementOf(state));
  if (item?.id !== input.itemId) throw new AppError(409, "ITEM_NOT_CURRENT", "Answer the current question; start returns it");
  await repo.insertResponse({ diagnosticId, itemId: item.id, seq: state.rows.length + 1, ...(await grade(userId, attempt, item, input)) });
  return inProgressView(attempt, { ...state, rows: await repo.listResponses(attempt.id) });
}

// Reading is graded on the spot against the sandbox-verified output, like rung 1. Code is queued to
// run in the sandbox now and its verdict is read at complete, so the learner never waits.
async function grade(userId: string, attempt: Attempt, item: State["items"][number], input: AnswerInput) {
  if ("dontKnow" in input) return { answer: { dontKnow: true }, isCorrect: false };
  if (item.dimension === "reading") {
    const { tests } = await getRunnableExercise(item.exerciseId!);
    return { answer: { output: input.answer }, isCorrect: sameOutput(input.answer, tests[0]?.expectedOutput ?? "") };
  }
  const key = `diagnostic:${attempt.id}:${item.id}`; // a retried request reuses the same submission
  const { submissionId } = await submitDiagnostic(userId, attempt.enrollmentId, item.exerciseId!, input.answer, key);
  return { answer: {}, isCorrect: null, submissionId };
}

// Copies a code task's verdict from M7 into M3's own row. SE is the sandbox's fault: left unobserved.
async function withVerdict(userId: string, row: Row) {
  if (!row.submissionId || row.isCorrect !== null) return { row, pending: false };
  const result = await getResult(userId, row.submissionId);
  if (!("verdict" in result)) return { row, pending: Date.now() - row.answeredAt.getTime() < GRADING_WAIT_MS };
  if (result.verdict === "SE") return { row, pending: false };
  await repo.setCorrect(row.id, result.verdict === "AC");
  return { row: { ...row, isCorrect: result.verdict === "AC" }, pending: false };
}

// POST /diagnostic/:id/complete: allowed at any time ("finish now"). Waits only while code tasks are
// still running, then stores one estimate per skill and seeds mastery (M4) and help (M12) together.
export async function complete(userId: string, diagnosticId: string) {
  const attempt = await ownAttempt(userId, diagnosticId);
  if (attempt.status !== "in_progress") return completedView(attempt);
  const state = await load(userId, attempt.courseId, attempt.languageCode, attempt.id);
  const refreshed = await Promise.all(state.rows.map((row) => withVerdict(userId, row)));
  if (refreshed.some((r) => r.pending)) return { diagnosticId, status: "grading" as const, retryAfterMs: RETRY_AFTER_MS };

  const results = estimate(placementOf(state, refreshed.map((r) => r.row)));
  await repo.finish(diagnosticId, results.map((r) => ({ diagnosticId, ...r })), async (tx) => {
    for (const r of results) {
      const key = { userId, skillId: r.skillId, languageCode: attempt.languageCode };
      const seeded = await seedFromDiagnostic(tx, { ...key, diagnosticId, reading: r.estReading, writing: r.estWriting, formulaVersion: PLACEMENT_VERSION });
      if (seeded && r.estWriting > 0) await startAtLastStage(tx, key, attempt.courseId); // proven in code: fast-track
    }
  });
  return completedView((await repo.findOwn(diagnosticId, userId))!);
}

// For M13: placement tests started and completed.
export const placementStats = repo.placementStats;

// For M1: the learner's own placement tests (DPDP access), and their erasure.
export const learnerPlacements = repo.learnerPlacements;
export const erasePlacements = repo.erasePlacements;
