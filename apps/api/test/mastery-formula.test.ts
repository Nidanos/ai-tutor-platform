import { describe, expect, it } from "vitest";
import { applyEvidence, dimensionOf, effectiveScore, type Evidence } from "../src/modules/m4_mastery/services/mastery-formula.js";

const e = (verdict: Evidence["verdict"], rung: number, extra: Partial<Evidence> = {}): Evidence => ({
  verdict,
  rung,
  hintsUsed: 0,
  activeMs: 0,
  isRepeatFailure: false,
  ...extra,
});

describe("mastery formula v1", () => {
  it("follows the approved journey: about five good solves pass 0.7", () => {
    let score = 0;
    score = applyEvidence(score, 0, e("AC", 2)).score;
    expect(score).toBeCloseTo(0.16);
    score = applyEvidence(score, 0, e("AC", 3, { hintsUsed: 1 })).score;
    expect(score).toBeCloseTo(0.331, 3);
    score = applyEvidence(score, 0, e("WA", 4)).score;
    score = applyEvidence(score, 0, e("AC", 4)).score;
    expect(score).toBeCloseTo(0.532, 3);
    score = applyEvidence(score, 0, e("AC", 5)).score;
    expect(score).toBeCloseTo(0.719, 3);
  });

  it("gives no credit for an AC after the solution was shown", () => {
    expect(applyEvidence(0.5, 0, e("AC", 5, { hintsUsed: 5 })).score).toBe(0.5);
  });

  it("penalises only the first WA or RE of an attempt, more on easy rungs", () => {
    expect(applyEvidence(0.5, 0, e("WA", 1)).score).toBeCloseTo(0.425); // 0.5 × (1 − 0.15)
    expect(applyEvidence(0.5, 0, e("RE", 5)).score).toBeCloseTo(0.485); // 0.5 × (1 − 0.03)
    expect(applyEvidence(0.5, 0, e("WA", 1, { isRepeatFailure: true })).score).toBe(0.5);
  });

  it("starts TLE/MLE tiny, doubles each time, caps at a WA, and lets only AC reset the streak", () => {
    const loss = (streak: number) => 1 - applyEvidence(1, streak, e("TLE", 1)).score;
    expect(loss(0)).toBeCloseTo(0.0075);
    expect(loss(1)).toBeCloseTo(0.015);
    expect(loss(9)).toBeCloseTo(0.15);
    expect(applyEvidence(0.5, 3, e("MLE", 1)).limitStreak).toBe(4);
    expect(applyEvidence(0.5, 3, e("WA", 1)).limitStreak).toBe(3);
    expect(applyEvidence(0.5, 3, e("AC", 1)).limitStreak).toBe(0);
  });

  it("leaves a counted compile error's score alone", () => {
    expect(applyEvidence(0.5, 0, e("CE", 3))).toEqual({ score: 0.5, weight: 0, limitStreak: 0 });
  });

  it("gives less credit when much slower than usual, but never below 70%", () => {
    const fast = applyEvidence(0, 0, e("AC", 5, { activeMs: 10 * 60_000 })).score;
    const slow = applyEvidence(0, 0, e("AC", 5, { activeMs: 120 * 60_000 })).score;
    expect(fast).toBeCloseTo(0.4);
    expect(slow).toBeCloseTo(0.4 * 0.7);
  });

  it("counts rung 1 as reading and rungs 2–5 as writing", () => {
    expect(dimensionOf(1)).toBe("reading");
    expect(dimensionOf(4)).toBe("writing");
  });

  it("halves effective mastery after ln 2 / λ days, and never decays without evidence", () => {
    const now = new Date("2026-10-16T00:00:00Z");
    const halfLife = new Date(now.getTime() - (Math.LN2 / 0.05) * 86_400_000);
    expect(effectiveScore(0.8, 0.05, halfLife, now)).toBeCloseTo(0.4);
    expect(effectiveScore(0, 0.05, null, now)).toBe(0);
  });
});
