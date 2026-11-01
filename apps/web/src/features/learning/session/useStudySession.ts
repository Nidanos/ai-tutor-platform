import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getActiveStudySession, startStudySession, updateStudySession } from "@/lib/api/learning";
import type { CourseSlug, StudySession } from "@ai-tutor/types";

/** Encapsulates session lifecycle; the backend remains authoritative for its step and timer. */
export function useStudySession(course: CourseSlug) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const value = await getActiveStudySession();
      if (mounted.current) setSession(value.session);
    } catch (cause) {
      if (mounted.current) setError(message(cause));
    } finally { if (mounted.current) setLoading(false); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => { mounted.current = false; window.clearTimeout(timer); };
  }, [load]);

  const start = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const value = await startStudySession(course);
      if (mounted.current) setSession(value.session);
      return value.session;
    } catch (cause) {
      if (mounted.current) setError(message(cause));
      return null;
    } finally { if (mounted.current) setBusy(false); }
  }, [course]);

  const setStatus = useCallback(async (status: "active" | "paused" | "ended") => {
    if (!session) return null;
    setBusy(true); setError("");
    try {
      const value = await updateStudySession(session.id, status);
      if (mounted.current) setSession(value.session);
      return value.session;
    } catch (cause) {
      if (mounted.current) setError(message(cause));
      if (cause instanceof ApiError && cause.body.code === "SESSION_ENDED") await load();
      return null;
    } finally { if (mounted.current) setBusy(false); }
  }, [load, session]);

  return { session, loading, busy, error, load, start, setStatus };
}

function message(cause: unknown): string {
  return cause instanceof ApiError ? cause.body.message : "Couldn't connect to the study-session service.";
}
