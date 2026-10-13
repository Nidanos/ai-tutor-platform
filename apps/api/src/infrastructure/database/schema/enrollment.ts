import { sql } from "drizzle-orm";
import { check, foreignKey, pgEnum, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { id, timestamps } from "./columns.js";
import { courseLanguages, skills } from "./curriculum.js";
import { users } from "./identity.js";

export const enrollmentStatus = pgEnum("enrollment_status", ["active", "paused", "completed", "dropped"]);

// "This learner studies this course, in this language, aiming at this goal."
export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    userId: uuid().notNull().references(() => users.id),
    courseId: uuid().notNull(),
    languageCode: text().notNull(),
    goalSkillId: uuid().references(() => skills.id, { onDelete: "set null" }),
    goalText: text(),
    status: enrollmentStatus().notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    unique("enrollments_track_unique").on(t.userId, t.courseId, t.languageCode),
    // Only languages the course actually offers.
    foreignKey({
      name: "enrollments_course_language_fk",
      columns: [t.courseId, t.languageCode],
      foreignColumns: [courseLanguages.courseId, courseLanguages.languageCode],
    }),
    check("enrollments_goal_text_length", sql`char_length(${t.goalText}) <= 300`),
  ],
);
