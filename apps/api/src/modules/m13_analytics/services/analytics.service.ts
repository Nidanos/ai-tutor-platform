import { learnerStats } from "../../m1_auth/services/auth.service.js";
import { getCourse, getSkillGraph, getSkills } from "../../m2_skills/services/skills.service.js";
import { placementStats } from "../../m3_diagnostic/services/diagnostic.service.js";
import { clearedSince, skillStats } from "../../m4_mastery/services/mastery-read.service.js";
import { countServable, listTitles } from "../../m6_exercises/services/exercises.service.js";
import { hardestExercises } from "../../m7_execution/services/attempts.service.js";
import { runStats } from "../../m7_execution/services/submissions.service.js";
import { sessionStats } from "../../m9_sessions/services/sessions.service.js";
import { stageMoves } from "../../m12_scaffolding/services/scaffolding.service.js";

const DAY_MS = 86_400_000;
const RUNGS = [1, 2, 3, 4, 5];
const HARDEST = { minAttempts: 3, limit: 5 }; // fewer attempts than this say nothing about an exercise

// GET /analytics/overview (admin only): aggregate counts for the window, never a learner's identity.
// Each number comes from the module that owns it; per-skill parts are for one course.
export async function overview(days: number, courseSlug: string, languageCode: string) {
  const since = new Date(Date.now() - days * DAY_MS);
  const course = await getCourse(courseSlug, languageCode);
  const graph = await getSkillGraph(course.id, languageCode);
  const skillIds = graph.map((s) => s.id);
  const [learners, placement, sessions, runs, hardest, outcomes, cleared, moves, content] = await Promise.all([
    learnerStats(since),
    placementStats(since),
    sessionStats(since),
    runStats(since),
    hardestExercises(since, HARDEST.minAttempts, HARDEST.limit),
    skillStats(skillIds),
    clearedSince(since),
    stageMoves(since),
    countServable(skillIds),
  ]);
  const titles = await listTitles(hardest.map((h) => h.exerciseId));
  const skillOf = new Map((await getSkills([...skillIds, ...titles.map((t) => t.skillId)])).map((s) => [s.id, { slug: s.slug, name: s.name }]));
  const outcomeOf = new Map(outcomes.map((o) => [o.skillId, o]));
  const se = runs.byVerdict.find((v) => v.verdict === "SE")?.n ?? 0;

  const contentSkills = graph.map((s) => {
    const byRung = Object.fromEntries(RUNGS.map((r) => [r, content.find((c) => c.skillId === s.id && c.rung === r)?.n ?? 0]));
    return { skill: skillOf.get(s.id)!, byRung, total: Object.values(byRung).reduce((a, b) => a + b, 0) };
  });
  return {
    window: { days, since },
    learners: { total: learners.total, joined: learners.joined, ranCode: runs.learners, pendingParent: learners.pendingParent, consented: learners.consented },
    study: { sessions: sessions.started, studyMinutes: Math.round(sessions.activeMs / 60_000), placementStarted: placement.started, placementCompleted: placement.completed },
    runs: {
      submissions: runs.submissions,
      byVerdict: Object.fromEntries(runs.byVerdict.map((v) => [v.verdict ?? "pending", v.n])),
      medianRunMs: runs.medianRunMs,
      sandboxErrorRate: runs.submissions ? se / runs.submissions : 0,
    },
    outcomes: {
      skillsCleared: cleared,
      stageMoves: Object.fromEntries(moves.map((m) => [m.reason, m.n])),
      skills: graph.map((s) => {
        const o = outcomeOf.get(s.id);
        return { skill: skillOf.get(s.id)!, learners: o?.learners ?? 0, avgReading: o?.avgReading ?? 0, avgWriting: o?.avgWriting ?? 0, cleared: o?.cleared ?? 0 };
      }),
    },
    content: { skills: contentSkills, skillsWithoutExercises: contentSkills.filter((s) => s.total === 0).length },
    hardest: hardest.map((h) => {
      const t = titles.find((x) => x.id === h.exerciseId)!;
      return { exerciseId: h.exerciseId, title: t.title, skill: skillOf.get(t.skillId), rung: t.rung, attempts: h.attempts, solveRate: h.solved / h.attempts };
    }),
  };
}
