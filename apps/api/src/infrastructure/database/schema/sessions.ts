import { sql } from "drizzle-orm";
import {
  doublePrecision,
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
import { createdAt, id, inRange, tz } from "./columns.js";
import { skills } from "./curriculum.js";
import { enrollments } from "./enrollment.js";
import { exercises } from "./exercises.js";
import { users } from "./identity.js";

export const recReason = pgEnum("rec_reason", ["new_skill", "review", "remediation"]);
export const recStatus = pgEnum("rec_status", ["proposed", "accepted", "completed", "skipped"]);
export const sessionStatus = pgEnum("session_status", ["active", "paused", "ended"]);
export const endReason = pgEnum("end_reason", ["user", "idle", "completed"]);
export const stepKind = pgEnum("step_kind", ["exercise", "review", "diagnostic"]);
export const stepStatus = pgEnum("step_status", ["pending", "active", "completed", "skipped"]);

// Stores its own reasons (scores + algorithm version), so every pick can be explained.
export const recommendations = pgTable(
  "recommendations",
  {
    id: id(),
    enrollmentId: uuid().notNull().references(() => enrollments.id),
    skillId: uuid().notNull().references(() => skills.id),
    rung: smallint().notNull(),
    reason: recReason().notNull(),
    totalScore: doublePrecision().notNull(),
    scoreBreakdown: jsonb().notNull(), // readiness, goal, urgency, recency
    candidatesSnapshot: jsonb().notNull(),
    algorithmVersion: text().notNull(),
    exerciseId: uuid().references(() => exercises.id), // what was served
    status: recStatus().notNull().default("proposed"),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.enrollmentId, t.createdAt), inRange("recommendations_rung_range", t.rung, 1, 5)],
);

export const learningSessions = pgTable(
  "learning_sessions",
  {
    id: id(),
    userId: uuid().notNull().references(() => users.id),
    enrollmentId: uuid().notNull().references(() => enrollments.id),
    status: sessionStatus().notNull().default("active"),
    startedAt: tz().notNull().defaultNow(),
    lastActiveAt: tz().notNull().defaultNow(),
    pausedAt: tz(),
    endedAt: tz(),
    endReason: endReason(),
    activeMs: integer().notNull().default(0),
  },
  (t) => [uniqueIndex("learning_sessions_one_open_per_user").on(t.userId).where(sql`${t.status} <> 'ended'`)],
);

// The current step is the session's single 'active' step, so resume needs no extra pointer.
export const sessionSteps = pgTable(
  "session_steps",
  {
    id: id(),
    sessionId: uuid().notNull().references(() => learningSessions.id),
    seq: smallint().notNull(),
    kind: stepKind().notNull(),
    recommendationId: uuid().references(() => recommendations.id),
    exerciseId: uuid().references(() => exercises.id),
    status: stepStatus().notNull().default("pending"),
    startedAt: tz(),
    completedAt: tz(),
  },
  (t) => [
    unique("session_steps_seq_unique").on(t.sessionId, t.seq),
    uniqueIndex("session_steps_one_active").on(t.sessionId).where(sql`${t.status} = 'active'`),
  ],
);
