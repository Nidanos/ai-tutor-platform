import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import { cppBasicsTemplates } from "../src/infrastructure/database/seed/cpp-templates.js";
import { harnessFor } from "../src/infrastructure/database/seed/seed-exercises.js";

const FIRST_FIVE = ["program-structure", "variables-and-types", "operators", "conditionals", "loops"];

describe("cpp-basics template bank", () => {
  it("covers rungs 1–5 for each of the first five skills, once each", () => {
    const keys = cppBasicsTemplates.map((t) => `${t.skill}:${t.rung}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const skill of FIRST_FIVE) {
      expect(cppBasicsTemplates.filter((t) => t.skill === skill).map((t) => t.rung).sort()).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("only uses skills that exist in the course", () => {
    const slugs = new Set(cppBasicsSkills.map((s) => s.slug));
    expect(cppBasicsTemplates.every((t) => slugs.has(t.skill))).toBe(true);
  });

  it("gives rung 1 a program to read and no harness; rungs 2–5 a function to write", () => {
    for (const t of cppBasicsTemplates) {
      if (t.rung === 1) {
        expect(t.starterCode).toBe(t.reference);
        expect(harnessFor(t)).toBeNull();
      } else {
        expect(t.functionSignature && t.call).toBeTruthy();
        expect(t.starterCode).not.toBe(t.reference);
        expect(harnessFor(t)).toContain(`case ${t.cases.length}:`); // one switch case per test
      }
    }
  });
});
