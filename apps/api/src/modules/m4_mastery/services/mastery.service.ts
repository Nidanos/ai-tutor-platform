import type { Tx } from "../../../infrastructure/database/index.js";
import { getSkill } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/mastery.repository.js";
import { applyEvidence, dimensionOf, type Evidence, FORMULA_VERSION } from "./mastery-formula.js";

const CLEAR_RUNG = 5;
const CLEAR_MAX_HINTS = 1;

export type GradedEvidence = Evidence & repo.LearnerSkill & { submissionId: string };

// The only writer of mastery (design §3): updates the snapshot and appends the ledger row,
// inside the caller's transaction, so a verdict and its mastery change are saved together.
export async function recordEvidence(tx: Tx, { userId, skillId, languageCode, submissionId, ...evidence }: GradedEvidence) {
  const key = { userId, skillId, languageCode };
  const { decayLambda } = await getSkill(skillId);
  const record = await repo.lockRecord(tx, key, decayLambda);

  const dimension = dimensionOf(evidence.rung);
  const before = dimension === "reading" ? record.readingScore : record.writingScore;
  const { score, weight, limitStreak } = applyEvidence(before, record.limitStreak, evidence);
  const now = new Date();
  const isAC = evidence.verdict === "AC";
  const clears = isAC && evidence.rung === CLEAR_RUNG && evidence.hintsUsed <= CLEAR_MAX_HINTS; // ADR-0007

  await repo.updateRecord(tx, key, {
    ...(dimension === "reading" ? { readingScore: score, readingEvidenceAt: now } : { writingScore: score, writingEvidenceAt: now }),
    attemptCount: record.attemptCount + 1, // safe: the row is locked
    successCount: record.successCount + (isAC ? 1 : 0),
    limitStreak,
    clearedAt: record.clearedAt ?? (clears ? now : null),
    version: record.version + 1,
  });
  await repo.insertEvidence(tx, {
    ...key,
    dimension,
    submissionId,
    verdict: evidence.verdict,
    rung: evidence.rung,
    hintsUsed: evidence.hintsUsed,
    timeTakenMs: evidence.activeMs || null,
    weight,
    scoreBefore: before,
    scoreAfter: score,
    formulaVersion: FORMULA_VERSION,
  });
}
