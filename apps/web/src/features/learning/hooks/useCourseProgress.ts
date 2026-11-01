import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getProgress } from "@/lib/api/learning";
import type { CourseSlug, ProgressResponse } from "@ai-tutor/types";

/** Loads server-owned skill state and exposes retry without coupling it to view components. */
export function useCourseProgress(courseSlug: CourseSlug) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      getProgress(courseSlug).then((value) => { if (active) setProgress(value); })
        .catch((cause: unknown) => { if (active) setError(cause instanceof ApiError ? cause.body.message : "Couldn't load course skills. Please try again."); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [courseSlug, reloadKey]);
  return { progress, error, loading, retry: () => setReloadKey((value) => value + 1) };
}
