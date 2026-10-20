import { bigint, index, integer, pgEnum, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { llmCalls } from "./analytics.js";
import { createdAt, id } from "./columns.js";
import { languageCode, skills } from "./curriculum.js";
import { users } from "./identity.js";

// Lessons are written for the learner's level on the skill (ADR-0019).
export const lessonLevel = pgEnum("lesson_level", ["new", "building", "strong"]);

// Frozen lessons (ADR-0005, ADR-0019): written once per skill, language and level, their programs
// proven in the sandbox, then served as they are. A better lesson is a new row with a new prompt version.
export const lessons = pgTable(
  "lessons",
  {
    id: id(),
    skillId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode().notNull(),
    level: lessonLevel().notNull(),
    explanationMd: text().notNull(),
    diagram: text().notNull(), // Mermaid source, drawn by the web app
    exampleCode: text().notNull(),
    exampleOutput: text().notNull(), // what the example printed in the sandbox
    exampleMd: text().notNull(), // the walk-through
    mistakesMd: text().notNull(),
    checkCode: text().notNull(), // a quick predict-the-output question
    checkOutput: text().notNull(),
    checkMd: text().notNull(), // why that is the output
    model: text().notNull(),
    promptVersion: text().notNull(),
    llmCallId: bigint({ mode: "number" }).references(() => llmCalls.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [unique("lessons_version_unique").on(t.skillId, t.languageCode, t.level, t.promptVersion)],
);

// The live note written for one learner over a lesson (ADR-0019). Personal data: it is in the learner's
// download and goes with their account. Reused until they practise the skill again.
export const lessonNotes = pgTable(
  "lesson_notes",
  {
    id: id(),
    userId: uuid().notNull().references(() => users.id),
    skillId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode().notNull(),
    bodyMd: text().notNull(),
    attemptsSeen: integer().notNull(), // the learner's attempt count on the skill when it was written
    llmCallId: bigint({ mode: "number" }).references(() => llmCalls.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.skillId, t.createdAt)],
);
