import { api } from "@/lib/api/client";
import { DEFAULT_LANGUAGE } from "./constants";
import type { CourseSlug, ProgressResponse, RecommendationResponse } from "./types";
import type { SessionResponse, StudySession } from "./session.types";

function courseQuery(course: CourseSlug) {
  return `course=${encodeURIComponent(course)}&language=${DEFAULT_LANGUAGE}`;
}

/** Read the server-calculated progress summary for the selected subject. */
export function getDashboardProgress(course: CourseSlug) {
  return api<ProgressResponse>(`/progress?${courseQuery(course)}`);
}

/** The recommendation service owns prerequisites and unfinished-attempt selection. */
export function getDashboardRecommendation(course: CourseSlug) {
  return api<RecommendationResponse>(`/recommendations/next?${courseQuery(course)}`);
}

export function getActiveSession() {
  return api<SessionResponse>("/sessions/active");
}

/** Starts a new session or resumes the learner's existing open session. */
export function startSession(course: CourseSlug) {
  return api<{ session: StudySession }>("/sessions", {
    method: "POST",
    body: JSON.stringify({ course, language: DEFAULT_LANGUAGE }),
  });
}
