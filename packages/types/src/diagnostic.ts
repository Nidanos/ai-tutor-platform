import type { CourseSlug } from "./index.js";

export type DiagnosticDimension = "reading" | "writing";

export type DiagnosticQuestion = {
  itemId: string;
  dimension: DiagnosticDimension;
  skill: { slug: string; name: string };
  promptMd: string;
  code: string;
  functionSignature?: string;
  sample?: { input: string | null; expectedOutput: string };
};

export type DiagnosticInProgress = {
  diagnosticId: string;
  attemptNo: number;
  status: "in_progress";
  answered: number;
  // The API returns null when the adaptive question sequence has no next item.
  question?: DiagnosticQuestion | null;
};

export type DiagnosticSkillResult = {
  skill: { id: string; slug: string; name: string };
  // The backend emits normalized estimates from 0 to 0.85 and confidence from 0 to 1.
  estReading: number;
  estWriting: number;
  confidence: number;
};

export type DiagnosticCompleted = {
  diagnosticId: string;
  attemptNo: number;
  status: "completed";
  completedAt: string;
  results: DiagnosticSkillResult[];
};

export type DiagnosticGrading = {
  diagnosticId: string;
  status: "grading";
  retryAfterMs: number;
};

export type DiagnosticStartRequest = {
  course: CourseSlug;
  language: "cpp";
  retake?: boolean;
};

export type DiagnosticAnswerRequest =
  | { itemId: string; answer: string }
  | { itemId: string; dontKnow: true };

export type DiagnosticStartResponse = {
  diagnostic: DiagnosticInProgress | DiagnosticCompleted;
};

export type DiagnosticAnswerResponse = {
  diagnostic: DiagnosticInProgress;
};

export type DiagnosticCompleteResponse = {
  diagnostic: DiagnosticCompleted | DiagnosticGrading;
};
