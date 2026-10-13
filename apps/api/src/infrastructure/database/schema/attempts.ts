import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { llmCalls } from "./analytics.js";
import { createdAt, id, inRange, logId, timestamps, tz } from "./columns.js";
import { languageCode } from "./curriculum.js";
import { enrollments } from "./enrollment.js";
import { exerciseHints, exercises, exerciseTests } from "./exercises.js";
import { users } from "./identity.js";
import { sessionSteps } from "./sessions.js";

export const verdict = pgEnum("verdict", ["AC", "WA", "CE", "RE", "TLE", "MLE", "SE"]);
export const attemptContext = pgEnum("attempt_context", ["practice", "review", "diagnostic", "holdout"]);
export const attemptStatus = pgEnum("attempt_status", ["active", "solved", "abandoned"]);
export const submissionStatus = pgEnum("submission_status", ["queued", "running", "completed"]);
export const runPurpose = pgEnum("run_purpose", ["submission", "verification", "timing"]);
export const solutionKind = pgEnum("solution_kind", ["learner", "reference", "brute_force", "empty_main"]);
export const runStatus = pgEnum("run_status", ["queued", "running", "completed", "sandbox_error"]);
export const hintKind = pgEnum("hint_kind", [
  "offered",
  "declined",
  "requested",
  "delivered",
  "blocked",
  "denied_ceiling",
  "bottomed_out",
]);

// One learner on one exercise. Owns the server-side hint level (FR-M8-01).
// context decides evidence: practice/review count, diagnostic seeds once, holdout calibrates first.
export const exerciseAttempts = pgTable(
  "exercise_attempts",
  {
    id: id(),
    userId: uuid().notNull().references(() => users.id),
    enrollmentId: uuid().notNull().references(() => enrollments.id),
    exerciseId: uuid().notNull().references(() => exercises.id),
    sessionStepId: uuid().references(() => sessionSteps.id),
    context: attemptContext().notNull().default("practice"),
    status: attemptStatus().notNull().default("active"),
    hintLevel: smallint().notNull().default(0),
    hintCeiling: smallint().notNull(), // copied from the skill's fade stage at start
    ceCount: smallint().notNull().default(0), // compile errors; the 3rd offers a hint
    submissionCount: smallint().notNull().default(0),
    bottomedOut: boolean().notNull().default(false),
    activeMs: integer().notNull().default(0),
    solvedAt: tz(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("exercise_attempts_one_active").on(t.userId, t.exerciseId).where(sql`${t.status} = 'active'`),
    index().on(t.userId, t.exerciseId),
    index().on(t.sessionStepId),
    inRange("exercise_attempts_hint_level_range", t.hintLevel, 0, 5),
    inRange("exercise_attempts_hint_ceiling_range", t.hintCeiling, 0, 5),
    check("exercise_attempts_hint_within_ceiling", sql`${t.hintLevel} <= ${t.hintCeiling}`),
  ],
);

// One press of Submit. answer = code (rungs 2-5) or the predicted output (rung 1).
export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    attemptId: uuid().notNull().references(() => exerciseAttempts.id),
    userId: uuid().notNull().references(() => users.id), // copied from the attempt for simpler queries
    exerciseId: uuid().notNull().references(() => exercises.id),
    languageCode: languageCode().notNull(),
    answer: text(), // emptied once the learner clears the skill
    answerSha256: text().notNull(), // kept after the purge
    answerPurgedAt: tz(),
    idempotencyKey: text().notNull().unique("submissions_idempotency_key_unique"),
    status: submissionStatus().notNull().default("queued"),
    verdict: verdict(),
    testsPassed: smallint(),
    testsTotal: smallint(),
    countsAsAttempt: boolean(), // decided at grading: false for SE, and CE before the 3rd
    createdAt: createdAt(),
    completedAt: tz(),
  },
  (t) => [
    index().on(t.attemptId, t.createdAt),
    index().on(t.userId, t.createdAt),
    check("submissions_answer_size", sql`octet_length(${t.answer}) <= 65536`),
  ],
);

// Learner runs and exercise-verification runs share one table: one source for execution stats.
export const sandboxRuns = pgTable(
  "sandbox_runs",
  {
    id: id(),
    purpose: runPurpose().notNull(),
    submissionId: uuid().references(() => submissions.id),
    exerciseId: uuid().notNull().references(() => exercises.id),
    solutionKind: solutionKind().notNull(),
    languageCode: languageCode().notNull(),
    toolchainVersion: text().notNull(),
    e2bSandboxId: text(),
    status: runStatus().notNull().default("queued"),
    verdict: verdict(),
    compileOutput: text(), // truncated by the judge
    exitCode: integer(),
    signal: text(),
    wallMs: integer(),
    peakMemoryKb: integer(),
    errorMessage: text(), // set when the sandbox itself failed (SE)
    createdAt: createdAt(),
    startedAt: tz(),
    finishedAt: tz(),
  },
  (t) => [
    index().on(t.submissionId),
    index().on(t.exerciseId, t.purpose),
    check("sandbox_runs_submission_iff_purpose", sql`(${t.purpose} = 'submission') = (${t.submissionId} is not null)`),
  ],
);

// Per-test results let the UI say "test 3 failed" without revealing hidden inputs.
export const runTestResults = pgTable(
  "run_test_results",
  {
    id: logId(),
    runId: uuid().notNull().references(() => sandboxRuns.id, { onDelete: "cascade" }),
    testId: uuid().notNull().references(() => exerciseTests.id),
    verdict: verdict().notNull(),
    timeMs: integer(),
    memoryKb: integer(),
    stdoutExcerpt: text(),
    stderrExcerpt: text(),
  },
  (t) => [unique("run_test_results_run_test_unique").on(t.runId, t.testId)],
);

// A log of help given. The current level lives on the attempt, not here.
export const hintEvents = pgTable(
  "hint_events",
  {
    id: logId(),
    attemptId: uuid().notNull().references(() => exerciseAttempts.id),
    level: smallint().notNull(),
    kind: hintKind().notNull(),
    hintId: uuid().references(() => exerciseHints.id),
    bodyMd: text(), // only for live (non-stored) hints
    filterResult: jsonb(),
    llmCallId: bigint({ mode: "number" }).references(() => llmCalls.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.attemptId, t.createdAt), inRange("hint_events_level_range", t.level, 1, 5)],
);
