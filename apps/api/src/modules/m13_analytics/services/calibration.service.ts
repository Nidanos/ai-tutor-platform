import type { Tx } from "../../../infrastructure/database/index.js";
import * as repo from "../repositories/calibration.repository.js";

// FR-M13-01 (ADR-0021): called by M7 inside the grading transaction, on a learner's first counted
// try at an exercise, with what M4 predicted just before the verdict moved it.
export const recordCalibration = (tx: Tx, row: repo.CalibrationRow) => repo.insertRecord(tx, row);

type Bin = { from: number; to: number; n: number; meanPredicted: number; passRate: number };

// How well predictions matched results: per dimension, the Brier score (0 is perfect; always
// guessing 0.5 scores 0.25) and a reliability table, where a calibrated model has meanPredicted ≈ passRate.
export async function calibrationStats(skillIds: string[], since: Date) {
  const rows = await repo.binStats(skillIds, since);
  const of = (dimension: "reading" | "writing") => {
    const mine = rows.filter((r) => r.dimension === dimension);
    const n = mine.reduce((total, r) => total + r.n, 0);
    const bins: Bin[] = mine
      .sort((a, b) => a.bin - b.bin)
      .map((r) => ({ from: r.bin / repo.BINS, to: (r.bin + 1) / repo.BINS, n: r.n, meanPredicted: r.predictedSum / r.n, passRate: r.passed / r.n }));
    return { tries: n, brier: n ? mine.reduce((total, r) => total + r.squaredErrorSum, 0) / n : null, bins };
  };
  return { reading: of("reading"), writing: of("writing") };
}

export const learnerCalibration = repo.learnerCalibration;
export const eraseCalibration = repo.eraseCalibration;
