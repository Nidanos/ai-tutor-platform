import { and, count, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { db, type Tx } from "../../../infrastructure/database/index.js";
import { calibrationRecords } from "../../../infrastructure/database/schema/index.js";

export type CalibrationRow = typeof calibrationRecords.$inferInsert;

export const BINS = 5; // predictions in fifths: 0–0.2, …, 0.8–1

export const insertRecord = (tx: Tx, values: CalibrationRow) => tx.insert(calibrationRecords).values(values);

const t = calibrationRecords;
const dimension = sql<"reading" | "writing">`case when ${t.rung} = 1 then 'reading' else 'writing' end`;
const predicted = sql`case when ${t.rung} = 1 then ${t.predictedReading} else ${t.predictedWriting} end`;
const passed = sql`(${t.observedVerdict} = 'AC')::int`;
const bin = sql<number>`least(floor(${predicted} * ${BINS}), ${BINS - 1})::int`;

// Per dimension and prediction bin: how many tries, how many passed, and the sums behind the
// mean prediction and the Brier score. Rung 1 tests reading; rungs 2–5 test writing.
export const binStats = (skillIds: string[], since: Date) =>
  skillIds.length
    ? db
        .select({
          dimension,
          bin,
          n: count(),
          passed: sum(passed).mapWith(Number),
          predictedSum: sum(predicted).mapWith(Number),
          squaredErrorSum: sum(sql`(${predicted} - ${passed}) ^ 2`).mapWith(Number),
        })
        .from(t)
        .where(and(inArray(t.skillId, skillIds), gte(t.createdAt, since)))
        .groupBy(sql`1, 2`) // by position: the bin's parameters differ between SELECT and GROUP BY
    : Promise.resolve([]);

// For M1 (DPDP access).
export const learnerCalibration = (userId: string) => db.select().from(t).where(eq(t.userId, userId));

// For M1 (DPDP erasure): only numbers here, kept only for learners who opted in to research or training.
export async function eraseCalibration(userId: string, keepNumbers: boolean) {
  if (!keepNumbers) await db.delete(t).where(eq(t.userId, userId));
}
