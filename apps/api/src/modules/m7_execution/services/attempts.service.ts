import { getSkill } from "../../m2_skills/services/skills.service.js";
import { ensureEnrollment } from "../../m3_diagnostic/services/enrollments.service.js";
import { getStage } from "../../m12_scaffolding/services/scaffolding.service.js";
import * as repo from "../repositories/attempts.repository.js";

type Exercise = { id: string; skillId: string; languageCode: string };

// Returns the learner's attempt on this exercise, starting one if needed. A solved attempt is
// returned as is (the exercise is done); an abandoned one is replaced by a fresh attempt.
// The hint ceiling is copied from the skill's current fade stage (ADR-0007).
export async function openAttempt(userId: string, exercise: Exercise) {
  const latest = await repo.findLatestAttempt(userId, exercise.id);
  if (latest && latest.status !== "abandoned") return latest;

  const skill = await getSkill(exercise.skillId);
  const { id: enrollmentId } = await ensureEnrollment(userId, skill.courseId, exercise.languageCode);
  const stage = await getStage({ userId, skillId: skill.id, languageCode: exercise.languageCode }, skill.courseId);
  await repo.insertAttempt({ userId, enrollmentId, exerciseId: exercise.id, hintCeiling: stage.maxHintLevel });
  return (await repo.findLatestAttempt(userId, exercise.id))!;
}

// For M5: each exercise this learner has touched, and whether it's still open.
export async function attemptStatuses(userId: string) {
  return new Map((await repo.listAttempts(userId)).map((a) => [a.exerciseId, a.status === "active" ? "active" : "done"] as const));
}
