import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id, inRange, timestamps } from "./columns.js";
import { organizations, users } from "./identity.js";

export const contentStatus = pgEnum("content_status", ["draft", "published", "retired"]);
export const skillType = pgEnum("skill_type", ["syntactic", "conceptual"]);
export const skillStatus = pgEnum("skill_status", ["active", "retired"]);
export const resourceKind = pgEnum("resource_kind", ["article", "docs"]);

// Keyed by a readable code ("cpp"), so language_code = 'cpp' reads well in every table.
export const languages = pgTable("languages", {
  code: text().primaryKey(),
  displayName: text().notNull(),
  toolchain: text().notNull(),
  toolchainVersion: text().notNull(),
  compileFlags: text().notNull(),
  isActive: boolean().notNull().default(true),
});

export const languageCode = () => text().references(() => languages.code);

export const courses = pgTable("courses", {
  id: id(),
  orgId: uuid().references(() => organizations.id), // null = public course
  slug: text().notNull().unique(),
  title: text().notNull(),
  description: text(),
  status: contentStatus().notNull().default("draft"),
  ...timestamps,
});

export const courseLanguages = pgTable(
  "course_languages",
  {
    courseId: uuid().notNull().references(() => courses.id, { onDelete: "cascade" }),
    languageCode: languageCode().notNull(),
    isDefault: boolean().notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.languageCode] })],
);

export const skills = pgTable(
  "skills",
  {
    id: id(),
    courseId: uuid().notNull().references(() => courses.id),
    slug: text().notNull(),
    name: text().notNull(),
    description: text(),
    skillType: skillType().notNull(),
    decayLambda: doublePrecision().notNull(), // per day; syntactic skills fade faster
    difficulty: smallint().notNull(),
    status: skillStatus().notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    unique("skills_course_slug_unique").on(t.courseId, t.slug),
    check("skills_decay_lambda_positive", sql`${t.decayLambda} > 0`),
    inRange("skills_difficulty_range", t.difficulty, 1, 5),
  ],
);

// The key of everything a learner has per skill: mastery, reviews, fade stage...
export const learnerSkill = () => ({
  userId: uuid().notNull().references(() => users.id),
  skillId: uuid().notNull().references(() => skills.id),
  languageCode: languageCode().notNull(),
});

// Graph edges. Cycles are rejected by the M2 service; Postgres can't check them.
export const skillPrerequisites = pgTable(
  "skill_prerequisites",
  {
    id: id(),
    skillId: uuid().notNull().references(() => skills.id),
    prerequisiteId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode(), // null = every language track
    minMastery: doublePrecision().notNull().default(0.7),
    createdBy: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("skill_prerequisites_edge_unique").on(t.skillId, t.prerequisiteId, t.languageCode).nullsNotDistinct(),
    index().on(t.prerequisiteId),
    check("skill_prerequisites_no_self_loop", sql`${t.skillId} <> ${t.prerequisiteId}`),
    inRange("skill_prerequisites_min_mastery_range", t.minMastery, 0, 1),
  ],
);

// "Further reading" links to original articles and docs. Reading them never changes mastery (FR-M4-02).
export const skillResources = pgTable(
  "skill_resources",
  {
    id: id(),
    skillId: uuid().notNull().references(() => skills.id),
    languageCode: languageCode(), // null = any language
    title: text().notNull(),
    url: text().notNull(),
    kind: resourceKind().notNull(),
    position: smallint().notNull().default(0),
    isActive: boolean().notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [unique("skill_resources_url_unique").on(t.skillId, t.url)],
);
