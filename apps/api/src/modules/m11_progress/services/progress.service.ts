import { getCourse, getSkillGraph } from "../../m2_skills/services/skills.service.js";
import { listMastery } from "../../m4_mastery/services/mastery-read.service.js";
import { EMPTY, isReviewDue, isUnlocked } from "../../m5_recommender/services/recommend.js";
import { listState } from "../../m12_scaffolding/services/scaffolding.service.js";

const STATUSES = ["locked", "ready", "in_progress", "cleared", "review_due"] as const;
type Status = (typeof STATUSES)[number];

// GET /progress (FR-M11-01..03): every skill of the course with reading and writing kept apart,
// as they are today (decayed, never rounded up), and a status from the same unlock rule as M5.
export async function getProgress(userId: string, courseSlug: string, languageCode: string) {
  const course = await getCourse(courseSlug, languageCode);
  const [graph, mastery, stages] = await Promise.all([
    getSkillGraph(course.id, languageCode),
    listMastery(userId, languageCode),
    listState(userId, languageCode),
  ]);
  const recordOf = new Map(mastery.map((m) => [m.skill.id, m]));
  const stageOf = new Map(stages.map((s) => [s.skill.id, s.stage]));
  const stateOf = (id: string) => {
    const m = recordOf.get(id);
    return m ? { reading: m.reading.effective, writing: m.writing.effective, cleared: m.clearedAt !== null, attempts: m.attemptCount } : EMPTY;
  };
  const statusOf = (skill: (typeof graph)[number]): Status => {
    const state = stateOf(skill.id);
    if (state.cleared) return isReviewDue(state) ? "review_due" : "cleared";
    if (!isUnlocked(skill, stateOf)) return "locked";
    return recordOf.has(skill.id) ? "in_progress" : "ready";
  };

  const skills = graph.map((skill) => {
    const m = recordOf.get(skill.id);
    const dimension = (d?: { score: number; effective: number }) => ({ score: d?.score ?? 0, effective: d?.effective ?? 0 });
    return {
      skill: { id: skill.id, slug: skill.slug, name: skill.name, description: skill.description, difficulty: skill.difficulty },
      prerequisites: skill.prerequisites.map((p) => p.id),
      reading: dimension(m?.reading),
      writing: dimension(m?.writing),
      stage: stageOf.get(skill.id) ?? null,
      status: statusOf(skill),
    };
  });
  const summary = Object.fromEntries(STATUSES.map((s) => [s, skills.filter((k) => k.status === s).length]));
  return { course: { slug: course.slug }, summary: { total: skills.length, ...summary }, skills };
}
