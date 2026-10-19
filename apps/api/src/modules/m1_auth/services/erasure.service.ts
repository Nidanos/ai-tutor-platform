import { hashPassword } from "../../../shared/auth/password.js";
import { randomToken } from "../../../shared/auth/tokens.js";
import { erasePlacements } from "../../m3_diagnostic/services/diagnostic.service.js";
import { eraseEnrollments, learnerEnrollments } from "../../m3_diagnostic/services/enrollments.service.js";
import { eraseMastery } from "../../m4_mastery/services/mastery.service.js";
import { eraseRecommendations } from "../../m5_recommender/services/recommender.service.js";
import { erasePractice } from "../../m7_execution/services/submissions.service.js";
import { eraseHints } from "../../m8_socratic/services/hints.service.js";
import { eraseSessions } from "../../m9_sessions/services/sessions.service.js";
import { eraseScaffolding } from "../../m12_scaffolding/services/scaffolding.service.js";
import * as repo from "../repositories/account.repository.js";

export const DELETION_GRACE_DAYS = 7;

const graceStart = () => new Date(Date.now() - DELETION_GRACE_DAYS * 86_400_000);

// DPDP doc §4. Code and the learner's own words always go. With an opt-in to research or AI training,
// the anonymous numbers (verdicts, scores, timings) stay; without one, every learning row goes.
export async function eraseAccount(userId: string) {
  const keepNumbers = await repo.hasOptIn(userId);
  // A hash of a password nobody knows: the account can never be logged in to again.
  if (!(await repo.closeAccount(userId, graceStart(), await hashPassword(randomToken())))) return; // logged in again: cancelled
  const enrollmentIds = (await learnerEnrollments(userId)).map((e) => e.id);
  // Rows that point at other modules' rows go first. review_items and calibration_records have no
  // writer yet: their module adds its step here when it gets one.
  await eraseMastery(userId, keepNumbers);
  await eraseScaffolding(userId, keepNumbers);
  await erasePlacements(userId, keepNumbers);
  await eraseHints(userId, keepNumbers);
  await erasePractice(userId, keepNumbers);
  await eraseSessions(userId, keepNumbers);
  await eraseRecommendations(enrollmentIds, keepNumbers);
  await eraseEnrollments(userId, keepNumbers);
  await repo.finishErasure(userId);
}

// The hourly job. Every step can run twice, so an account that fails is simply tried again next hour,
// and doesn't hold up the others.
export async function eraseDueAccounts() {
  for (const { id } of await repo.dueForErasure(graceStart())) {
    await eraseAccount(id).catch((err) => console.error(`Erasing account ${id} failed`, err));
  }
}
