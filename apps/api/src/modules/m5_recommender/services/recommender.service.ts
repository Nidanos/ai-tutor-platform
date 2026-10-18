import { ensureEnrollment } from "../../m3_diagnostic/services/enrollments.service.js";
import { getCourse, getSkill, getSkillGraph } from "../../m2_skills/services/skills.service.js";
import { effectiveStates } from "../../m4_mastery/services/mastery-read.service.js";
import { listServable } from "../../m6_exercises/services/exercises.service.js";
import { attemptStatuses } from "../../m7_execution/services/attempts.service.js";
import { minRungs } from "../../m12_scaffolding/services/scaffolding.service.js";
import * as repo from "../repositories/recommendations.repository.js";
import { ALGORITHM_VERSION, EMPTY, pickExercise, rankCandidates, rungFor } from "./recommend.js";

type Enrollment = { id: string; courseId: string; languageCode: string; goalSkillId: string | null };

const SNAPSHOT_SIZE = 5; // top candidates stored with each pick, to explain it later

// GET /recommendations/next (design §6.7): the best candidate that has an exercise to serve.
// A skill with no content yet is skipped, so learners never get stuck while the bank is small;
// if no candidate has content, the top one is returned without an exercise (to be generated).
export async function nextStep(userId: string, courseSlug: string, languageCode: string) {
  const course = await getCourse(courseSlug, languageCode);
  const enrollment = await ensureEnrollment(userId, course.id, languageCode);
  return recommendNext(userId, { ...enrollment, courseId: course.id, languageCode });
}

// For M9: the next step for an enrollment the caller already holds. Saved like every pick.
export async function recommendNext(userId: string, enrollment: Enrollment) {
  const { courseId, languageCode } = enrollment;
  const [graph, mastery, stages, attempts] = await Promise.all([
    getSkillGraph(courseId, languageCode),
    effectiveStates(userId, languageCode),
    minRungs(userId, languageCode),
    attemptStatuses(userId),
  ]);

  const candidates = rankCandidates(graph, mastery, enrollment.goalSkillId);
  if (!candidates.length) return null; // every skill cleared and fresh: the course is done

  const exercises = await listServable(candidates.map((c) => c.skill.id), languageCode);
  const choices = candidates.map((candidate) => {
    const minRung = stages.get(candidate.skill.id) ?? 1;
    const rung = rungFor(mastery.get(candidate.skill.id) ?? EMPTY, minRung);
    const options = exercises
      .filter((e) => e.skillId === candidate.skill.id)
      .map((e) => ({ id: e.id, rung: e.rung, attempt: attempts.get(e.id) ?? ("none" as const) }));
    return { candidate, rung, exercise: pickExercise(options, rung, minRung) };
  });
  const chosen = choices.find((c) => c.exercise) ?? choices[0];

  const { skill, reason, score, breakdown } = chosen.candidate;
  const id = await repo.insertRecommendation({
    enrollmentId: enrollment.id,
    skillId: skill.id,
    rung: chosen.exercise?.rung ?? chosen.rung,
    reason,
    totalScore: score,
    scoreBreakdown: breakdown,
    candidatesSnapshot: candidates.slice(0, SNAPSHOT_SIZE).map((c) => ({ skill: c.skill.slug, reason: c.reason, score: c.score })),
    algorithmVersion: ALGORITHM_VERSION,
    exerciseId: chosen.exercise?.id ?? null,
  });
  const { name } = graph.find((s) => s.id === skill.id)!;
  return {
    id,
    skill: { id: skill.id, slug: skill.slug, name },
    rung: chosen.exercise?.rung ?? chosen.rung,
    reason,
    exerciseId: chosen.exercise?.id ?? null,
  };
}

// For M9: what a saved pick was, to show a session's current step.
export async function getRecommendation(id: string) {
  const rec = (await repo.findRecommendation(id))!;
  const { slug, name } = await getSkill(rec.skillId);
  return { ...rec, skill: { id: rec.skillId, slug, name } };
}
