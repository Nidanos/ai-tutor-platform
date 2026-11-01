import type { Attempt, Exercise, Hint, SubmissionResult } from "@ai-tutor/types";
export type PracticeView = "loading" | "ready" | "submitting" | "pending" | "error";
export type SubmissionRequest = { attemptId: string; answer: string; idempotencyKey: string };
export type ExerciseState = { exercise: Exercise | null; attempt: Attempt | null; answer: string };
export type SubmissionState = { result: SubmissionResult | null; pendingId: string | null; view: PracticeView; error: string };
export type HintState = { hints: Hint[]; loading: boolean };
