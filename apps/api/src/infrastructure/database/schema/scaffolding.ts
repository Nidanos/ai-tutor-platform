import { sql } from "drizzle-orm";
import { boolean, foreignKey, index, pgTable, primaryKey, smallint, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { submissions } from "./attempts.js";
import { createdAt, id, inRange, timestamps, tz } from "./columns.js";
import { courses, learnerSkill } from "./curriculum.js";
import { organizations, users } from "./identity.js";

export const fadeSchedules = pgTable(
  "fade_schedules",
  {
    id: id(),
    orgId: uuid().references(() => organizations.id), // null = global
    courseId: uuid().references(() => courses.id),
    name: text().notNull(),
    isDefault: boolean().notNull().default(false),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("fade_schedules_one_default_per_course").on(t.courseId).where(sql`${t.isDefault}`)],
);

// A stage limits help (hint ceiling, easiest rung) until the learner solves
// advanceRung with at most advanceMaxHints hints; then the skill moves to the next stage.
export const fadeStages = pgTable(
  "fade_stages",
  {
    scheduleId: uuid().notNull().references(() => fadeSchedules.id, { onDelete: "cascade" }),
    stageNo: smallint().notNull(),
    minRung: smallint().notNull(),
    maxHintLevel: smallint().notNull(),
    advanceRung: smallint().notNull(),
    advanceMaxHints: smallint().notNull().default(1),
    description: text(),
  },
  (t) => [
    primaryKey({ columns: [t.scheduleId, t.stageNo] }),
    inRange("fade_stages_min_rung_range", t.minRung, 1, 5),
    inRange("fade_stages_max_hint_level_range", t.maxHintLevel, 0, 5),
    inRange("fade_stages_advance_rung_range", t.advanceRung, 1, 5),
  ],
);

// Help fades per skill: each skill sits on its own stage. Only M12 writes this table.
export const skillScaffolding = pgTable(
  "skill_scaffolding",
  {
    ...learnerSkill(),
    scheduleId: uuid().notNull(),
    currentStage: smallint().notNull(),
    stageEnteredAt: tz().notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.skillId, t.languageCode] }),
    // A skill can never sit on a stage its schedule doesn't have.
    foreignKey({
      name: "skill_scaffolding_stage_fk",
      columns: [t.scheduleId, t.currentStage],
      foreignColumns: [fadeStages.scheduleId, fadeStages.stageNo],
    }),
  ],
);

// Every stage move, with the solve that caused it: evidence that learners need less help over time.
export const fadeStageChanges = pgTable(
  "fade_stage_changes",
  {
    id: id(),
    ...learnerSkill(),
    fromStage: smallint(), // null when the skill first gets a stage
    toStage: smallint().notNull(),
    submissionId: uuid().references(() => submissions.id),
    reason: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.skillId)],
);
