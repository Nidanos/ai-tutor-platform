import { db } from "../infrastructure/database/index.js";
import { cppLessons } from "../infrastructure/database/seed/cpp-lessons/index.js";
import { DEFAULT_LANGUAGE } from "../infrastructure/database/seed/data.js";
import { getCourse, getSkillGraph } from "../modules/m2_skills/services/skills.service.js";
import { addHandWrittenLesson, hasLesson } from "../modules/m6_exercises/services/freeze-lesson.js";

// Freezes the hand-written C++ basics lessons (ADR-0019) that aren't in yet, through the same gates as a
// generated one: no practice exercise given away, both programs proven in the sandbox. Safe to re-run.
// `pnpm lessons:seed`, after `pnpm db:seed` and `pnpm exercises:verify`.
const course = await getCourse("cpp-basics", DEFAULT_LANGUAGE);
const skillIds = new Map((await getSkillGraph(course.id, DEFAULT_LANGUAGE)).map((s) => [s.slug, s.id]));
const counts = { added: 0, already: 0, failed: 0 };
for (const { skill, level, ...draft } of cppLessons) {
  const key = { skillId: skillIds.get(skill)!, languageCode: DEFAULT_LANGUAGE, level };
  if (await hasLesson(key)) {
    counts.already++;
    continue;
  }
  const result = await addHandWrittenLesson(key, draft);
  counts[result.ok ? "added" : "failed"]++;
  console.log(`${result.ok ? "ok    " : "FAILED"} ${skill} · ${level}${result.ok ? "" : `: ${result.reason}`}`);
}
console.log(`${counts.added} added, ${counts.already} already there, ${counts.failed} failed.`);
await db.$client.end();
