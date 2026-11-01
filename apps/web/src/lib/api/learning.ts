import type {
  CourseSlug,
  Hint,
  LessonResponse,
  MasteryResponse,
  NoteResponse,
  OpenExercise,
  PendingSubmission,
  ProgressResponse,
  RecommendationResponse,
  SessionResponse,
  SkillMastery,
  StudySession,
  SubmissionQueued,
  SubmissionResult,
} from "@ai-tutor/types";
import { api } from "./client";

// Every course is in C++ for now.
const LANGUAGE = "cpp";
const courseQuery = (course: CourseSlug) => `course=${encodeURIComponent(course)}&language=${LANGUAGE}`;
const id = encodeURIComponent;

/** The recommendation service owns prerequisite gating and unfinished exercise selection. */
export const getNextRecommendation = (course: CourseSlug) => api<RecommendationResponse>(`/recommendations/next?${courseQuery(course)}`);

export const getProgress = (course: CourseSlug) => api<ProgressResponse>(`/progress?${courseQuery(course)}`);

/** The mastery API is language-scoped; keep only this course's skills. */
export async function getMastery(course: CourseSlug): Promise<MasteryResponse> {
  const [mastery, progress] = await Promise.all([api<MasteryResponse>(`/mastery?language=${LANGUAGE}`), getProgress(course)]);
  const courseIds = new Set(progress.skills.map((item) => item.skill.id));
  return { skills: mastery.skills.filter((item) => courseIds.has(item.skill.id)) };
}

/** One skill's scores with their history; GET /mastery lists the scores only. */
export const getSkillMastery = (skillId: string) => api<SkillMastery>(`/mastery/${id(skillId)}?language=${LANGUAGE}`);

/** Opening an exercise creates or resumes the learner's attempt on the server. */
export const getExercise = (exerciseId: string) => api<OpenExercise>(`/exercises/${id(exerciseId)}`);

export const submitExercise = (attemptId: string, answer: string, idempotencyKey: string) =>
  api<SubmissionQueued>("/submissions", { method: "POST", body: JSON.stringify({ attemptId, answer, idempotencyKey }) });

export const getSubmissionResult = (submissionId: string) =>
  api<SubmissionResult | PendingSubmission>(`/submissions/${id(submissionId)}/result`);

export const requestHint = (exerciseId: string, code: string) =>
  api<{ hint: Hint }>(`/exercises/${id(exerciseId)}/hints`, { method: "POST", body: JSON.stringify({ code }) });

export const getLesson = (skillId: string) => api<LessonResponse>(`/lessons/${id(skillId)}?language=${LANGUAGE}`);

export const getLessonNote = (skillId: string) => api<NoteResponse>(`/lessons/${id(skillId)}/note?language=${LANGUAGE}`, { method: "POST" });

/** Starts a study session or resumes the learner's open one. */
export const startStudySession = (course: CourseSlug) =>
  api<{ session: StudySession }>("/sessions", { method: "POST", body: JSON.stringify({ course, language: LANGUAGE }) });

export const getActiveStudySession = () => api<SessionResponse>("/sessions/active");

export const updateStudySession = (sessionId: string, status: "active" | "paused" | "ended") =>
  api<{ session: StudySession }>(`/sessions/${id(sessionId)}`, { method: "PATCH", body: JSON.stringify({ status }) });
