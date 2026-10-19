import { AppError } from "../../../shared/errors/app-error.js";
import { getCourse } from "../../m2_skills/services/skills.service.js";
import { ensureEnrollment, getEnrollment } from "../../m3_diagnostic/services/enrollments.service.js";
import { getRecommendation, recommendNext } from "../../m5_recommender/services/recommender.service.js";
import { attemptStatuses } from "../../m7_execution/services/attempts.service.js";
import * as repo from "../repositories/sessions.repository.js";
import { settle, touch, transition } from "./session-clock.js";

export type StartInput = { course: string; language: string };
type Current = { session: repo.Session; step?: repo.Step };

// Brings a stored session up to date (idle pause, timeout end) and saves what changed.
async function settled(session: repo.Session) {
  const changes = settle(session);
  return Object.keys(changes).length ? repo.updateSession(session.id, changes) : session;
}

// FR-M9-02/03: the current step, or, once its exercise is solved, the next one from the recommender.
// No step while the next skill has no exercise yet; a finished course ends the session.
async function current(userId: string, session: repo.Session): Promise<Current> {
  let step: repo.Step | undefined = await repo.findActiveStep(session.id);
  if (step?.exerciseId && (await attemptStatuses(userId)).get(step.exerciseId) === "done") {
    await repo.completeStep(step.id);
    step = undefined;
  }
  if (step) return { session, step };

  const next = await recommendNext(userId, await getEnrollment(session.enrollmentId));
  if (!next) return { session: await repo.updateSession(session.id, { status: "ended", endedAt: new Date(), endReason: "completed" }) };
  if (!next.exerciseId) return { session };
  const kind = next.reason === "review" ? "review" : "exercise";
  return { session, step: await repo.addStep(session.id, { kind, recommendationId: next.id, exerciseId: next.exerciseId }) };
}

async function view({ session, step }: Current) {
  const pick = step?.recommendationId ? await getRecommendation(step.recommendationId) : undefined;
  const { id, status, startedAt, lastActiveAt, activeMs, endedAt, endReason } = session;
  return {
    id,
    status,
    startedAt,
    lastActiveAt,
    activeMs,
    endedAt,
    endReason,
    step: step && pick ? { id: step.id, seq: step.seq, kind: step.kind, skill: pick.skill, rung: pick.rung, exerciseId: step.exerciseId } : null,
  };
}

// POST /sessions: resumes the learner's open session, or starts one. An open session for another
// course is ended first (one session at a time).
export async function start(userId: string, { course: courseSlug, language }: StartInput) {
  const course = await getCourse(courseSlug, language);
  const { id: enrollmentId } = await ensureEnrollment(userId, course.id, language);
  let session = await repo.findOpen(userId);
  if (session) session = await settled(session);
  if (session && session.status !== "ended" && session.enrollmentId !== enrollmentId) {
    session = await repo.updateSession(session.id, transition(session, "ended"));
  }
  if (!session || session.status === "ended") session = await repo.createSession(userId, enrollmentId);
  else session = await repo.updateSession(session.id, session.status === "paused" ? transition(session, "active") : touch(session));
  return view(await current(userId, session));
}

// GET /sessions/active: the open session and its current step, or null.
export async function active(userId: string) {
  const open = await repo.findOpen(userId);
  if (!open) return null;
  let session = await settled(open);
  if (session.status === "ended") return null;
  if (session.status === "active") session = await repo.updateSession(session.id, touch(session));
  return view(await current(userId, session));
}

// PATCH /sessions/:id (FR-M9-01): pause, resume or end.
export async function setStatus(userId: string, id: string, to: "active" | "paused" | "ended") {
  const own = await repo.findOwn(id, userId);
  if (!own) throw new AppError(404, "SESSION_NOT_FOUND", "No such session");
  const session = await settled(own);
  if (session.status === "ended") throw new AppError(409, "SESSION_ENDED", "This session has ended; start a new one");
  const changes = transition(session, to);
  const updated = Object.keys(changes).length ? await repo.updateSession(id, changes) : session;
  return updated.status === "ended" ? view({ session: updated }) : view(await current(userId, updated));
}

// For M13: sessions started and study time.
export const sessionStats = repo.sessionStats;

// For M1: the learner's own sessions (DPDP access), and their erasure.
export const learnerSessions = repo.learnerSessions;
export const eraseSessions = repo.eraseSessions;
