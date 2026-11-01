import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api/client";
import { getActiveStudySession, getNextRecommendation, getProgress } from "@/lib/api/learning";
import type { CourseSlug, ProgressResponse, RecommendationResponse, StudySession } from "@ai-tutor/types";

export function useDashboardData(course: CourseSlug) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState("");
  const [recommendationError, setRecommendationError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const mounted = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true); setProgressError(""); setRecommendationError(""); setSessionError("");
    const results = await Promise.allSettled([
      getProgress(course), getNextRecommendation(course), getActiveStudySession(),
    ]);
    if (!mounted.current) return;
    if (results[0].status === "fulfilled") setProgress(results[0].value);
    else setProgressError(errorMessage(results[0].reason, "Couldn't load your learning progress."));
    if (results[1].status === "fulfilled") setRecommendation(results[1].value);
    else setRecommendationError(errorMessage(results[1].reason, "Couldn't load your next learning step."));
    if (results[2].status === "fulfilled") setSession(results[2].value.session);
    else setSessionError(errorMessage(results[2].reason, "Couldn't load your study session."));
    setLoading(false);
  }, [course]);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setTimeout(() => { void reload(); }, 0);
    return () => { mounted.current = false; window.clearTimeout(timer); };
  }, [reload]);

  return { progress, recommendation, session, loading, progressError, recommendationError, sessionError, reload };
}
