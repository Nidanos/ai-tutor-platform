import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getActiveStudySession, getSubmissionResult, submitExercise } from "@/lib/api/learning";
import type { Attempt, SubmissionResult } from "@ai-tutor/types";
import type { PracticeView, SubmissionRequest } from "./practice.types";

export function useSubmissionFlow() {
  const [view, setView] = useState<PracticeView>("ready");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<SubmissionRequest | null>(null);
  const timer = useRef<number | null>(null);
  const disposed = useRef(false);
  const clearTimer = useCallback(() => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; }, []);
  useEffect(() => { disposed.current = false; return () => { disposed.current = true; clearTimer(); }; }, [clearTimer]);

  const poll = useCallback(async function pollSubmission(id: string, remaining = 35): Promise<void> {
    try {
      const value = await getSubmissionResult(id);
      if (disposed.current) return;
      if (value.status === "completed") {
        setResult(value); setPendingId(null); setView("ready"); setError("");
        // Session advancement is triggered by this read after an exercise is solved.
        if (value.verdict === "AC") await getActiveStudySession().catch(() => undefined);
        return;
      }
      setPendingId(id);
      if (remaining <= 0) { setView("pending"); setError("The judge is still running. Check this same submission again shortly."); return; }
      setView("submitting"); timer.current = window.setTimeout(() => { void pollSubmission(id, remaining - 1); }, 1000);
    } catch (cause) { setPendingId(id); setView("pending"); setError(message(cause)); }
  }, []);

  const send = useCallback(async (request: SubmissionRequest) => {
    setView("submitting"); setError("");
    try {
      const value = await submitExercise(request.attemptId, request.answer, request.idempotencyKey);
      setRetryRequest(null); setPendingId(value.submissionId);
      await poll(value.submissionId, value.status === "completed" ? 0 : 35);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 0) {
        setRetryRequest(request); setView("pending");
        setError("The connection failed during submission. Retry this exact request safely before editing the answer.");
      } else { setView("error"); setError(message(cause)); }
    }
  }, [poll]);

  const submit = useCallback(async (attempt: Attempt | null, answer: string) => {
    if (!attempt || attempt.status !== "active" || !answer.trim() || view === "submitting" || view === "pending") return;
    clearTimer(); setResult(null);
    await send({ attemptId: attempt.id, answer, idempotencyKey: crypto.randomUUID() });
  }, [clearTimer, send, view]);

  const retry = useCallback(async () => { if (retryRequest) await send(retryRequest); }, [retryRequest, send]);
  const checkAgain = useCallback(() => { if (pendingId) { setError(""); void poll(pendingId); } }, [pendingId, poll]);
  const resetForNext = () => { setResult(null); setError(""); setPendingId(null); setRetryRequest(null); setView("ready"); };
  return { view, setView, error, setError, result, setResult, pendingId, retryRequest, submit, retry, checkAgain, resetForNext };
}
function message(cause: unknown) { return cause instanceof ApiError ? cause.body.message : cause instanceof Error ? cause.message : "Something went wrong. Please try again."; }
