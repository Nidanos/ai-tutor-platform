import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { submissions } from "./attempts.js";
import { id, inRange, tz } from "./columns.js";
import { contentStatus, languageCode, skills } from "./curriculum.js";
import { enrollments } from "./enrollment.js";
import { exercises } from "./exercises.js";

export const dimension = pgEnum("dimension", ["reading", "writing"]);
export const diagnosticStatus = pgEnum("diagnostic_status", ["in_progress", "completed", "abandoned"]);

// Frozen placement questions (ADR-0012). Each points at a verified exercise: its test is the reading
// answer key, and writing items run in the sandbox.
export const diagnosticItems = pgTable(
  "diagnostic_items",
  {
    id: id(),
    skillId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode().notNull(),
    dimension: dimension().notNull(),
    difficulty: smallint().notNull(),
    promptMd: text().notNull(),
    payload: jsonb().notNull(), // what the learner sees: the code (and, for writing, the signature and one sample)
    answerKey: jsonb(), // unused: the key is the verified exercise test, never stored twice
    exerciseId: uuid().references(() => exercises.id),
    contentVersion: text().notNull(),
    status: contentStatus().notNull().default("published"),
  },
  (t) => [
    index("diagnostic_items_pick_idx")
      .on(t.skillId, t.languageCode, t.dimension, t.difficulty)
      .where(sql`${t.status} = 'published'`),
    inRange("diagnostic_items_difficulty_range", t.difficulty, 1, 5),
  ],
);

export const diagnosticAttempts = pgTable(
  "diagnostic_attempts",
  {
    id: id(),
    enrollmentId: uuid().notNull().references(() => enrollments.id),
    attemptNo: smallint().notNull(), // 2 on a retake
    status: diagnosticStatus().notNull().default("in_progress"),
    startedAt: tz().notNull().defaultNow(),
    completedAt: tz(),
  },
  (t) => [
    unique("diagnostic_attempts_number_unique").on(t.enrollmentId, t.attemptNo),
    uniqueIndex("diagnostic_attempts_one_in_progress").on(t.enrollmentId).where(sql`${t.status} = 'in_progress'`),
  ],
);

export const diagnosticResponses = pgTable(
  "diagnostic_responses",
  {
    id: id(),
    diagnosticId: uuid().notNull().references(() => diagnosticAttempts.id),
    itemId: uuid().notNull().references(() => diagnosticItems.id),
    seq: smallint().notNull(),
    answer: jsonb().notNull(),
    isCorrect: boolean(), // null until graded (writing items are graded later, in the sandbox)
    submissionId: uuid().references(() => submissions.id),
    timeTakenMs: integer(),
    answeredAt: tz().notNull().defaultNow(),
  },
  (t) => [
    unique("diagnostic_responses_item_unique").on(t.diagnosticId, t.itemId),
    unique("diagnostic_responses_seq_unique").on(t.diagnosticId, t.seq),
  ],
);

// One estimate per skill; seeds mastery when the test completes, raise-only (FR-M3-02).
export const diagnosticResults = pgTable(
  "diagnostic_results",
  {
    diagnosticId: uuid().notNull().references(() => diagnosticAttempts.id),
    skillId: uuid().notNull().references(() => skills.id),
    estReading: doublePrecision().notNull(),
    estWriting: doublePrecision().notNull(),
    confidence: doublePrecision().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.diagnosticId, t.skillId] }),
    inRange("diagnostic_results_reading_range", t.estReading, 0, 1),
    inRange("diagnostic_results_writing_range", t.estWriting, 0, 1),
    inRange("diagnostic_results_confidence_range", t.confidence, 0, 1),
  ],
);
