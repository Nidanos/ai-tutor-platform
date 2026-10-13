import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { submissions, verdict } from "./attempts.js";
import { createdAt, id, inRange, logId, timestamps, tz } from "./columns.js";
import { learnerSkill } from "./curriculum.js";
import { diagnosticAttempts, dimension } from "./diagnostic.js";

export const reviewStatus = pgEnum("review_status", ["scheduled", "completed", "cancelled"]);
export const reviewReason = pgEnum("review_reason", ["decay", "manual", "failed_prereq"]);

// Today's numbers (snapshot). Only M4 writes here, always together with an evidence row.
// Effective mastery = score × e^(−λ × days since that dimension's evidence), computed on read.
export const masteryRecords = pgTable(
  "mastery_records",
  {
    ...learnerSkill(),
    readingScore: doublePrecision().notNull().default(0),
    writingScore: doublePrecision().notNull().default(0),
    readingEvidenceAt: tz(),
    writingEvidenceAt: tz(),
    clearedAt: tz(), // first AC on rung 5 with 0 or 1 hint
    attemptCount: integer().notNull().default(0),
    successCount: integer().notNull().default(0),
    decayLambda: doublePrecision().notNull(), // copied from the skill
    limitStreak: smallint().notNull().default(0), // consecutive TLE/MLE, reset on AC
    version: integer().notNull().default(0), // optimistic lock
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.skillId, t.languageCode] }),
    index().on(t.userId, t.languageCode),
    inRange("mastery_records_reading_range", t.readingScore, 0, 1),
    inRange("mastery_records_writing_range", t.writingScore, 0, 1),
  ],
);

// The history behind every number (ledger). Never edited. Exactly one real source per row.
export const evidenceEvents = pgTable(
  "evidence_events",
  {
    id: logId(),
    ...learnerSkill(),
    dimension: dimension().notNull(),
    submissionId: uuid().references(() => submissions.id),
    diagnosticId: uuid().references(() => diagnosticAttempts.id),
    verdict: verdict(),
    rung: smallint(),
    hintsUsed: smallint().notNull().default(0),
    timeTakenMs: integer(),
    weight: doublePrecision().notNull(),
    scoreBefore: doublePrecision().notNull(),
    scoreAfter: doublePrecision().notNull(),
    formulaVersion: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("evidence_events_one_source", sql`num_nonnulls(${t.submissionId}, ${t.diagnosticId}) = 1`),
    // A retried job can never count the same evidence twice.
    unique("evidence_events_submission_unique").on(t.submissionId, t.dimension),
    unique("evidence_events_diagnostic_unique").on(t.diagnosticId, t.skillId, t.dimension),
    index().on(t.userId, t.skillId, t.createdAt),
    inRange("evidence_events_before_range", t.scoreBefore, 0, 1),
    inRange("evidence_events_after_range", t.scoreAfter, 0, 1),
  ],
);

// A review is due when dueAt has passed; "due" is computed, never stored.
export const reviewItems = pgTable(
  "review_items",
  {
    id: id(),
    ...learnerSkill(),
    status: reviewStatus().notNull().default("scheduled"),
    reason: reviewReason().notNull(),
    dueAt: tz().notNull(),
    intervalDays: doublePrecision().notNull(),
    ease: doublePrecision().notNull().default(2.5),
    lastOutcome: verdict(),
    createdAt: createdAt(),
    completedAt: tz(),
  },
  (t) => [
    uniqueIndex("review_items_one_open")
      .on(t.userId, t.skillId, t.languageCode)
      .where(sql`${t.status} = 'scheduled'`),
    index("review_items_due_idx").on(t.dueAt).where(sql`${t.status} = 'scheduled'`),
  ],
);
