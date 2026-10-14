import { doublePrecision, pgTable, uuid } from "drizzle-orm/pg-core";
import { submissions, verdict } from "./attempts.js";
import { createdAt, id, inRange } from "./columns.js";
import { learnerSkill } from "./curriculum.js";
import { exercises } from "./exercises.js";

// Predicted mastery vs the result on a held-out exercise: M13's main quality number.
export const calibrationRecords = pgTable(
  "calibration_records",
  {
    id: id(),
    ...learnerSkill(),
    exerciseId: uuid().notNull().references(() => exercises.id), // a 'holdout' exercise
    submissionId: uuid()
      .notNull()
      .unique("calibration_records_submission_unique")
      .references(() => submissions.id),
    predictedReading: doublePrecision().notNull(),
    predictedWriting: doublePrecision().notNull(),
    observedVerdict: verdict().notNull(), // passed = AC
    createdAt: createdAt(),
  },
  (t) => [
    inRange("calibration_records_reading_range", t.predictedReading, 0, 1),
    inRange("calibration_records_writing_range", t.predictedWriting, 0, 1),
  ],
);

