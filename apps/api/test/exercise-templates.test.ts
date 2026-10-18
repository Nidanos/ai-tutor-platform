import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import { cppDiagnosticReading } from "../src/infrastructure/database/seed/cpp-diagnostic-reading.js";
import { cppDiagnosticWriting } from "../src/infrastructure/database/seed/cpp-diagnostic-writing.js";
import { cppBasicsTemplates } from "../src/infrastructure/database/seed/cpp-templates.js";
import { diagnosticPayload, harnessFor } from "../src/infrastructure/database/seed/seed-exercises.js";

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

describe("cpp-basics placement test bank", () => {
  it("has exactly one reading item and one code task per course skill", () => {
    const slugs = cppBasicsSkills.map((s) => s.slug).sort();
    expect(cppDiagnosticReading.map((t) => t.skill).sort()).toEqual(slugs);
    expect(cppDiagnosticWriting.map((t) => t.skill).sort()).toEqual(slugs);
  });

  it("asks reading as a program to read, showing only the code", () => {
    for (const t of cppDiagnosticReading) {
      expect([t.rung, t.cases.length, harnessFor(t)]).toEqual([1, 1, null]);
      expect(t.starterCode).toBe(t.reference);
      expect(diagnosticPayload(t)).toEqual({ code: t.starterCode });
    }
  });

  it("asks code tasks as a rung-5 function with hidden tests beyond the shown example", () => {
    for (const t of cppDiagnosticWriting) {
      expect(t.rung).toBe(5);
      expect(t.cases.length).toBeGreaterThanOrEqual(3);
      expect(t.starterCode).not.toBe(t.reference);
      expect(harnessFor(t)).toContain(`case ${t.cases.length}:`);
      expect(diagnosticPayload(t)).toMatchObject({ functionSignature: t.functionSignature, sample: { expectedOutput: t.cases[0].expected } });
    }
  });
});
