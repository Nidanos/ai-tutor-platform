import { and, eq } from "drizzle-orm";
import type { Tx } from "../../../infrastructure/database/index.js";
import { evidenceEvents, masteryRecords } from "../../../infrastructure/database/schema/index.js";

export type LearnerSkill = { userId: string; skillId: string; languageCode: string };

const whereKey = (k: LearnerSkill) =>
  and(eq(masteryRecords.userId, k.userId), eq(masteryRecords.skillId, k.skillId), eq(masteryRecords.languageCode, k.languageCode));

// Creates the row on first evidence, then locks it until the transaction ends, so two runs
// finishing at once can't overwrite each other's update.
export async function lockRecord(tx: Tx, key: LearnerSkill, decayLambda: number) {
  await tx.insert(masteryRecords).values({ ...key, decayLambda }).onConflictDoNothing();
  return (await tx.select().from(masteryRecords).where(whereKey(key)).for("update"))[0];
}

export const updateRecord = (tx: Tx, key: LearnerSkill, values: Partial<typeof masteryRecords.$inferInsert>) =>
  tx.update(masteryRecords).set(values).where(whereKey(key));

export const insertEvidence = (tx: Tx, values: typeof evidenceEvents.$inferInsert) => tx.insert(evidenceEvents).values(values);
