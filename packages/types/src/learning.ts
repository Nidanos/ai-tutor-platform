import type { ExerciseRung, SkillRef } from "./dashboard.js";

// GET /exercises/:id
export type Exercise = {
  id: string;
  title: string;
  promptMd: string;
  starterCode: string;
  functionSignature: string | null;
  rung: ExerciseRung;
  languageCode: "cpp";
  timeLimitMs: number;
  memoryLimitMb: number;
  skill: SkillRef & { description: string | null; resources: Array<{ title: string; url: string; kind: "article" | "docs" }> };
  sampleTests: Array<{ seq: number; name: string; input: string | null; expectedOutput: string | null }>;
};
export type Attempt = { id: string; status: "active" | "solved" | "abandoned"; hintLevel: number; hintCeiling: number; submissionCount: number };
export type OpenExercise = { exercise: Exercise; attempt: Attempt };

// POST /submissions and GET /submissions/:id/result
export type SubmissionQueued = { submissionId: string; status: "queued" | "completed" };
export type PendingSubmission = { submissionId: string; status: "queued" | "running" };
export type Verdict = "AC" | "WA" | "CE" | "RE" | "TLE" | "MLE" | "SE";
export type SubmissionResult = {
  submissionId: string;
  status: "completed";
  verdict: Verdict;
  testsPassed: number;
  testsTotal: number;
  compileOutput?: string;
  tests: Array<{
    seq: number;
    name: string;
    visibility: "sample" | "hidden";
    verdict: string;
    timeMs: number;
    input?: string;
    expectedOutput?: string;
    output?: string;
  }>;
};

// POST /exercises/:id/hints
export type Hint = { level: 1 | 2 | 3 | 4 | 5; ceiling: number; bodyMd: string; source: "live" | "frozen" | "generic" | "answer" };

// GET /lessons/:skillId and POST /lessons/:skillId/note
export type LessonLevel = "new" | "building" | "strong";
export type Lesson = {
  id: string;
  level: LessonLevel;
  explanationMd: string;
  diagram: string;
  example: { code: string; output: string; walkthroughMd: string };
  mistakesMd: string;
  check: { code: string; output: string; explanationMd: string };
};
export type LessonResponse = { level: LessonLevel; lesson: Lesson | null };
export type NoteResponse = { note: { bodyMd: string } | null };

// GET /mastery
export type MasteryDimension = { score: number; effective: number; lastEvidenceAt: string | null };
export type SkillMastery = {
  skill: SkillRef;
  languageCode: string;
  reading: MasteryDimension;
  writing: MasteryDimension;
  clearedAt: string | null;
  attemptCount: number;
  successCount: number;
  history?: Array<{
    dimension: "reading" | "writing";
    verdict: string | null; // null with rung null: the placement test's starting score
    rung: number | null;
    hintsUsed: number;
    scoreBefore: number;
    scoreAfter: number;
    createdAt: string;
  }>;
};
export type MasteryResponse = { skills: SkillMastery[] };
