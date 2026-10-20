import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import { cppLessons } from "../src/infrastructure/database/seed/cpp-lessons/index.js";
import { LEVELS, lessonDraft } from "../src/modules/m6_exercises/services/lesson-draft.js";

// The sandbox proof runs in `pnpm lessons:seed`; this checks the files themselves.
describe("cpp-basics hand-written lessons", () => {
  it("has one lesson for every skill and level", () => {
    const keys = cppLessons.map((l) => `${l.skill} · ${l.level}`).sort();
    expect(keys).toEqual(cppBasicsSkills.flatMap((s) => LEVELS.map((level) => `${s.slug} · ${level}`)).sort());
  });

  it("fits the lesson schema, as a generated one must", () => {
    for (const { skill, level, ...draft } of cppLessons) {
      expect(lessonDraft.safeParse(draft).error?.issues, `${skill} · ${level}`).toBeUndefined();
    }
  });
});
