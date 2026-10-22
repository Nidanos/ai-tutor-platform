import { doublePrecision, pgTable, smallint, uuid } from "drizzle-orm/pg-core";
import { submissions, verdict } from "./attempts.js";
import { createdAt, id, inRange } from "./columns.js";
import { learnerSkill } from "./curriculum.js";
import { exercises } from "./exercises.js";

// Predicted mastery vs the result of a learner's first counted try at an exercise: M13's main
// quality number (ADR-0021). The rung is copied so M13 reads the right dimension without M6's tables.
export const calibrationRecords = pgTable(
  "calibration_records",
  {
    id: id(),
    ...learnerSkill(),
    exerciseId: uuid().notNull().references(() => exercises.id),
    submissionId: uuid()
      .notNull()
      .unique("calibration_records_submission_unique")
      .references(() => submissions.id),
    rung: smallint().notNull(),
    predictedReading: doublePrecision().notNull(),
    predictedWriting: doublePrecision().notNull(),
    observedVerdict: verdict().notNull(), // passed = AC
    createdAt: createdAt(),
  },
  (t) => [
    inRange("calibration_records_rung_range", t.rung, 1, 5),
    inRange("calibration_records_reading_range", t.predictedReading, 0, 1),
    inRange("calibration_records_writing_range", t.predictedWriting, 0, 1),
  ],
);
