import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { CourseSlug, ProgressResponse, RecommendationResponse, StudySession } from "@ai-tutor/types";
import { getActiveSession, getDashboardProgress, getDashboardRecommendation } from "./api";

const message = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.body.message : fallback;

export function useDashboardData(course: CourseSlug) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [errors, setErrors] = useState({ progress: "", recommendation: "", session: "" });
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setProgress(null);
    setRecommendation(null);
    setSession(null);
    setErrors({ progress: "", recommendation: "", session: "" });
    const results = await Promise.allSettled([
      getDashboardProgress(course), getDashboardRecommendation(course), getActiveSession(),
    ]);
    if (currentRequest !== requestId.current) return;
    if (results[0].status === "fulfilled") setProgress(results[0].value);
    else {
      const error = message(results[0].reason, "Progress unavailable.");
      setErrors((old) => ({ ...old, progress: error }));
    }
    if (results[1].status === "fulfilled") setRecommendation(results[1].value);
    else {
      const error = message(results[1].reason, "Recommendation unavailable.");
      setErrors((old) => ({ ...old, recommendation: error }));
    }
    if (results[2].status === "fulfilled") setSession(results[2].value.session);
    else {
      const error = message(results[2].reason, "Session unavailable.");
      setErrors((old) => ({ ...old, session: error }));
    }
    setLoading(false);
  }, [course]);

  useEffect(() => { void reload(); }, [reload]);
  return { progress, recommendation, session, errors, loading, reload };
}
