import type { Verdict } from "../../m7_execution/services/judge.js";

// The M4 formula, v1 (ADR-0004, approved 15 Oct). Pure: no database. Every evidence row stores
// FORMULA_VERSION, so old numbers stay explainable when these constants are tuned.
export const FORMULA_VERSION = "m4-v1";
const GAIN = 0.4; // AC moves the score 40% of the way to 1, scaled by weight
const PENALTY = 0.15; // WA/RE take 15% of the score, scaled by failWeight
const HINT_COST = 0.15; // each hint used cuts the AC credit by 15%
const BOTTOM_OUT_LEVEL = 5; // hint 5 shows the solution: no credit
const LIMIT_START = PENALTY / 20; // TLE/MLE start at 1/20 of a WA, doubling, capped at a WA
const USUAL_MINUTES = [5, 8, 12, 15, 20]; // per rung; placeholders until real timings exist
const SLOWEST_TIME_FACTOR = 0.7;

export type Evidence = {
  verdict: Verdict;
  rung: number;
  hintsUsed: number;
  activeMs: number; // 0 until sessions track active time; then time counts
  isRepeatFailure: boolean; // an earlier WA/RE in the same attempt was already penalised
};

export type Update = { score: number; weight: number; limitStreak: number };

// Rung 1 is "predict the output", so it's evidence about reading code; rungs 2–5 about writing it.
export const dimensionOf = (rung: number) => (rung === 1 ? "reading" : "writing");

export function applyEvidence(before: number, limitStreak: number, e: Evidence): Update {
  const unchanged = { score: before, weight: 0, limitStreak };
  const failWeight = (6 - e.rung) / 5; // failing an easy exercise says more than failing a hard one

  switch (e.verdict) {
    case "AC": {
      const hints = e.hintsUsed >= BOTTOM_OUT_LEVEL ? 0 : 1 - HINT_COST * e.hintsUsed;
      const weight = (e.rung / 5) * hints * timeFactor(e);
      return { score: before + GAIN * weight * (1 - before), weight, limitStreak: 0 };
    }
    case "WA":
    case "RE":
      return e.isRepeatFailure ? unchanged : { score: before * (1 - PENALTY * failWeight), weight: failWeight, limitStreak };
    case "TLE":
    case "MLE": {
      const penalty = Math.min(LIMIT_START * 2 ** limitStreak, PENALTY) * failWeight;
      return { score: before * (1 - penalty), weight: failWeight, limitStreak: limitStreak + 1 };
    }
    default:
      return unchanged; // a counted CE: it shows in attempt totals but doesn't move the score
  }
}

// Slower than the rung's usual time lowers credit, never below 0.7. No time tracked = full credit.
function timeFactor({ rung, activeMs }: Evidence) {
  if (!activeMs) return 1;
  const usualMs = USUAL_MINUTES[rung - 1] * 60_000;
  return Math.min(1, Math.max(SLOWEST_TIME_FACTOR, usualMs / activeMs));
}

const DAY_MS = 86_400_000;

// FR-M4-03: what the learner can still do today. Stored scores never decay; this is computed on read.
export const effectiveScore = (score: number, decayLambda: number, evidenceAt: Date | null, now = new Date()) =>
  evidenceAt ? score * Math.exp((-decayLambda * (now.getTime() - evidenceAt.getTime())) / DAY_MS) : score;
