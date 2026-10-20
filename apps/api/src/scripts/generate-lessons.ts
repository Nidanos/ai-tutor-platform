import { db } from "../infrastructure/database/index.js";
import { DEFAULT_LANGUAGE } from "../infrastructure/database/seed/data.js";
import { spentThisMonthInr } from "../infrastructure/llm/llm-log.js";
import { getCourse, getSkillGraph } from "../modules/m2_skills/services/skills.service.js";
import { hasLesson } from "../modules/m6_exercises/services/freeze-lesson.js";
import { generateLesson, LESSON_BUDGET_INR } from "../modules/m6_exercises/services/generate-lesson.js";
import { LEVELS } from "../modules/m6_exercises/services/lesson-draft.js";

// Writes the frozen lessons (ADR-0019) for every skill of a course, at every level that has none yet
// (hand-written ones included), proving each program in the sandbox. Safe to re-run.
// `pnpm lessons:generate <course> [--free-tier]`. --free-tier lets these calls run before billing is on:
// lessons carry no learner data (Ashwani's call, 20 Oct). Live notes and hints never use it.
const courseSlug = process.argv[2];
if (!courseSlug) throw new Error("Usage: pnpm lessons:generate <course> [--free-tier]");
const allowFreeTier = process.argv.includes("--free-tier");

const course = await getCourse(courseSlug, DEFAULT_LANGUAGE);
const skills = await getSkillGraph(course.id, DEFAULT_LANGUAGE);
const counts = { written: 0, already: 0, failed: 0 };
for (const skill of skills.sort((a, b) => a.difficulty - b.difficulty || a.slug.localeCompare(b.slug))) {
  for (const level of LEVELS) {
    if (await hasLesson({ skillId: skill.id, languageCode: DEFAULT_LANGUAGE, level })) {
      counts.already++;
      continue;
    }
    const result = await generateLesson(skill.id, DEFAULT_LANGUAGE, level, { allowFreeTier });
    counts[result.ok ? "written" : "failed"]++;
    console.log(`${result.ok ? "ok    " : "FAILED"} ${skill.slug} · ${level}${result.ok ? "" : `: ${result.reason}`}`);
  }
}
const spent = await spentThisMonthInr("explanation");
console.log(`${counts.written} written, ${counts.already} already there, ${counts.failed} failed. Lessons this month: ₹${spent} of ₹${LESSON_BUDGET_INR}.`);
await db.$client.end();
