import type { Tx } from "../../../infrastructure/database/index.js";
import { getSkill } from "../../m2_skills/services/skills.service.js";
import * as repo from "../repositories/mastery.repository.js";
import { applyEvidence, dimensionOf, effectiveScore, type Evidence, FORMULA_VERSION } from "./mastery-formula.js";

const CLEAR_RUNG = 5;
const CLEAR_MAX_HINTS = 1;
const NOTICEABLE_FADE = 0.01; // a seed faded by less isn't worth a new evidence row

export type GradedEvidence = Evidence & repo.LearnerSkill & { submissionId: string };

// The only writer of mastery (design §3): updates the snapshot and appends the ledger row,
// inside the caller's transaction, so a verdict and its mastery change are saved together.
// Returns what the model predicted just before this evidence: today's effective scores (for M13).
export async function recordEvidence(tx: Tx, { userId, skillId, languageCode, submissionId, ...evidence }: GradedEvidence) {
  const key = { userId, skillId, languageCode };
  const { decayLambda } = await getSkill(skillId, tx);
  const record = await repo.lockRecord(tx, key, decayLambda);
  const now = new Date();
  const predicted = {
    reading: effectiveScore(record.readingScore, decayLambda, record.readingEvidenceAt, now),
    writing: effectiveScore(record.writingScore, decayLambda, record.writingEvidenceAt, now),
  };

  const dimension = dimensionOf(evidence.rung);
  const before = dimension === "reading" ? record.readingScore : record.writingScore;
  const { score, weight, limitStreak } = applyEvidence(before, record.limitStreak, evidence);
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
  return predicted;
}

export type DiagnosticSeed = repo.LearnerSkill & { diagnosticId: string; reading: number; writing: number; formulaVersion: string };

// FR-M3-02: the placement test's estimates become a skill's starting scores (ADR-0012). A cleared
// skill is left alone (false). Scores only go up, so practice gains are never lowered and a retake
// can refresh a faded seed. A seed is never an attempt and never clears a skill.
export async function seedFromDiagnostic(tx: Tx, { diagnosticId, reading, writing, formulaVersion, ...key }: DiagnosticSeed) {
  if (!reading && !writing) return false;
  const { decayLambda } = await getSkill(key.skillId, tx);
  const record = await repo.lockRecord(tx, key, decayLambda);
  if (record.clearedAt) return false;

  const now = new Date();
  const dimensions = [
    ["reading", reading, record.readingScore, record.readingEvidenceAt],
    ["writing", writing, record.writingScore, record.writingEvidenceAt],
  ] as const;
  for (const [dimension, estimate, before, evidenceAt] of dimensions) {
    if (estimate - effectiveScore(before, decayLambda, evidenceAt, now) < NOTICEABLE_FADE) continue;
    await repo.updateRecord(tx, key, {
      ...(dimension === "reading" ? { readingScore: estimate, readingEvidenceAt: now } : { writingScore: estimate, writingEvidenceAt: now }),
      version: record.version + 1,
    });
    await repo.insertEvidence(tx, { ...key, dimension, diagnosticId, weight: 1, scoreBefore: before, scoreAfter: estimate, formulaVersion });
  }
  return true;
}

// For M1: DPDP erasure.
export const eraseMastery = repo.eraseMastery;
