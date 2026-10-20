import { getSkillMastery } from "../../m4_mastery/services/mastery-read.service.js";
import * as repo from "../repositories/lessons.repository.js";
import { LEVELS, type Level, levelFor } from "./lesson-draft.js";

const view = (l: repo.Lesson) => ({
  id: l.id,
  level: l.level,
  explanationMd: l.explanationMd,
  diagram: l.diagram,
  example: { code: l.exampleCode, output: l.exampleOutput, walkthroughMd: l.exampleMd },
  mistakesMd: l.mistakesMd,
  check: { code: l.checkCode, output: l.checkOutput, explanationMd: l.checkMd },
});

// The lesson written for this level, or else the nearest level's: the easier one on a tie, then the newest.
const distance = (a: Level, b: Level) => Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(b));
const nearest = (lessons: repo.Lesson[], level: Level) =>
  [...lessons].sort((a, b) => distance(a.level, level) - distance(b.level, level) || LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level))[0];

// GET /lessons/:skillId (ADR-0019): the frozen lesson for the learner's level on the skill, from
// today's scores. Null until one is written. Reading it never changes mastery (ADR-0004).
export async function getLesson(userId: string, skillId: string, languageCode: string) {
  const [mastery, lessons] = await Promise.all([getSkillMastery(userId, skillId, languageCode), repo.listLessons(skillId, languageCode)]);
  const level = levelFor({ reading: mastery.reading.effective, writing: mastery.writing.effective, cleared: mastery.clearedAt !== null });
  const lesson = nearest(lessons, level);
  return { level, lesson: lesson ? view(lesson) : null };
}
