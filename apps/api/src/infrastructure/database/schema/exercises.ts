import { sql } from "drizzle-orm";
import {
  boolean,
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
import { languageCode, skills } from "./curriculum.js";
import { users } from "./identity.js";

export const exercisePurpose = pgEnum("exercise_purpose", ["practice", "holdout", "diagnostic"]);
export const exerciseSource = pgEnum("exercise_source", ["generated", "template"]);
export const exerciseStatus = pgEnum("exercise_status", ["draft", "verifying", "verified", "rejected", "retired"]);
export const testSize = pgEnum("test_size", ["small", "large"]);
export const testVisibility = pgEnum("test_visibility", ["sample", "hidden"]);
export const hintSource = pgEnum("hint_source", ["pregenerated", "reference"]);
export const genTrigger = pgEnum("gen_trigger", ["pregen", "on_demand"]);
export const genStatus = pgEnum("gen_status", ["queued", "generating", "verifying", "succeeded", "fell_back"]);
export const genStage = pgEnum("gen_stage", [
  "llm",
  "schema",
  "compile",
  "reference",
  "brute_force",
  "tests_too_weak",
  "sandbox",
]);

// What a learner may see. Frozen once verified: a change is a new row with a new contentVersion.
export const exercises = pgTable(
  "exercises",
  {
    id: id(),
    skillId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode().notNull(),
    rung: smallint().notNull(),
    variantSeed: integer().notNull(),
    contentVersion: text().notNull(), // toolchain + prompt + schema version
    purpose: exercisePurpose().notNull().default("practice"),
    source: exerciseSource().notNull(),
    status: exerciseStatus().notNull().default("draft"),
    title: text().notNull(),
    promptMd: text().notNull(),
    starterCode: text().notNull(),
    functionSignature: text(), // null for rung 1 (predict the output)
    timeLimitMs: integer().notNull(),
    memoryLimitMb: integer().notNull(),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    verifiedAt: tz(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("exercises_content_key_unique").on(t.skillId, t.languageCode, t.rung, t.variantSeed, t.contentVersion),
    index("exercises_servable_idx")
      .on(t.skillId, t.languageCode, t.rung, t.purpose)
      .where(sql`${t.status} = 'verified'`),
    inRange("exercises_rung_range", t.rung, 1, 5),
    inRange("exercises_time_limit_range", t.timeLimitMs, 50, 10000),
    inRange("exercises_memory_limit_range", t.memoryLimitMb, 16, 1024),
  ],
);

// The server-only half. API responses are built from `exercises` alone, so these can't leak.
export const exerciseSecrets = pgTable("exercise_secrets", {
  exerciseId: uuid()
    .primaryKey()
    .references(() => exercises.id, { onDelete: "cascade" }),
  harnessCode: text(), // main() + test calls; null for rung 1
  referenceSolution: text().notNull(),
  bruteForceSolution: text(), // null for hand-written templates
  testGeneratorCode: text(),
  generatorSeed: integer(),
});

// Every test stores its expected output: the judge compares outside the sandbox (ADR-0003).
// Hidden tests' input and output never leave the server.
export const exerciseTests = pgTable(
  "exercise_tests",
  {
    id: id(),
    exerciseId: uuid().notNull().references(() => exercises.id),
    seq: smallint().notNull(),
    name: text().notNull(),
    size: testSize().notNull(),
    visibility: testVisibility().notNull(),
    input: text(),
    expectedOutput: text(),
  },
  (t) => [unique("exercise_tests_seq_unique").on(t.exerciseId, t.seq)],
);

// Five frozen levels per exercise; level 5 is the reference solution.
export const exerciseHints = pgTable(
  "exercise_hints",
  {
    id: id(),
    exerciseId: uuid().notNull().references(() => exercises.id),
    level: smallint().notNull(),
    bodyMd: text().notNull(),
    source: hintSource().notNull(),
    filterPassed: boolean().notNull(),
    model: text(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("exercise_hints_level_unique").on(t.exerciseId, t.level),
    inRange("exercise_hints_level_range", t.level, 1, 5),
  ],
);

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: id(),
    skillId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode().notNull(),
    rung: smallint().notNull(),
    variantSeed: integer().notNull(),
    trigger: genTrigger().notNull(),
    requestedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    status: genStatus().notNull().default("queued"),
    tries: smallint().notNull().default(0),
    exerciseId: uuid().references(() => exercises.id),
    fallbackExerciseId: uuid().references(() => exercises.id),
    queueJobId: text(),
    model: text().notNull(),
    promptVersion: text().notNull(),
    createdAt: createdAt(),
    startedAt: tz(),
    finishedAt: tz(),
  },
  (t) => [
    // Two requests can't generate the same exercise at the same time.
    uniqueIndex("generation_jobs_one_active_per_key")
      .on(t.skillId, t.languageCode, t.rung, t.variantSeed)
      .where(sql`${t.status} in ('queued', 'generating', 'verifying')`),
    index().on(t.status, t.createdAt),
    inRange("generation_jobs_rung_range", t.rung, 1, 5),
    inRange("generation_jobs_tries_range", t.tries, 0, 3),
  ],
);

export const generationFailures = pgTable("generation_failures", {
  id: id(),
  generationJobId: uuid().notNull().references(() => generationJobs.id),
  tryNo: smallint().notNull(),
  stage: genStage().notNull(),
  details: jsonb().notNull().default({}),
  createdAt: createdAt(),
});
