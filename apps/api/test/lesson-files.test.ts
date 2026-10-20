import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import { dsaSkills } from "../src/infrastructure/database/seed/dsa.js";
import { courseLessons } from "../src/infrastructure/database/seed/lessons.js";
import { LEVELS, lessonDraft } from "../src/modules/m6_exercises/services/lesson-draft.js";

const SKILLS = { "cpp-basics": cppBasicsSkills, dsa: dsaSkills };
const COMPLETE = ["cpp-basics"]; // DSA's lessons are being written skill by skill

// The sandbox proof runs in `pnpm lessons:seed`; this checks the files themselves.
describe.each(Object.entries(courseLessons))("%s hand-written lessons", (course, lessons) => {
  const skills = SKILLS[course as keyof typeof SKILLS].map((s) => s.slug);

  it("are for skills of the course, with all three levels each", () => {
    const written = [...new Set(lessons.map((l) => l.skill))];
    expect(written.filter((slug) => !skills.includes(slug))).toEqual([]);
    for (const slug of written) expect(lessons.filter((l) => l.skill === slug).map((l) => l.level)).toEqual([...LEVELS]);
    if (COMPLETE.includes(course)) expect(written.sort()).toEqual([...skills].sort());
  });

  it("fit the lesson schema, as a generated one must", () => {
    for (const { skill, level, ...draft } of lessons) {
      expect(lessonDraft.safeParse(draft).error?.issues, `${skill} · ${level}`).toBeUndefined();
    }
  });
});
