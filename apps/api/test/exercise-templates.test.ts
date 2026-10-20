import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import { cppDiagnosticReading } from "../src/infrastructure/database/seed/cpp-diagnostic-reading.js";
import { cppDiagnosticWriting } from "../src/infrastructure/database/seed/cpp-diagnostic-writing.js";
import { cppPracticeBank } from "../src/infrastructure/database/seed/cpp-practice-bank.js";
import { dsaPracticeBank } from "../src/infrastructure/database/seed/dsa-exercises/index.js";
import { dsaSkills } from "../src/infrastructure/database/seed/dsa.js";
import { diagnosticPayload, harnessFor } from "../src/infrastructure/database/seed/seed-exercises.js";

describe("cpp-basics template bank", () => {
  it("covers rungs 1–5 for every course skill, once each", () => {
    for (const { slug } of cppBasicsSkills) {
      expect(cppPracticeBank.filter((t) => t.skill === slug).map((t) => t.rung).sort()).toEqual([1, 2, 3, 4, 5]);
    }
    expect(cppPracticeBank).toHaveLength(cppBasicsSkills.length * 5);
  });

  it("only uses skills that exist in the course", () => {
    const slugs = new Set(cppBasicsSkills.map((s) => s.slug));
    expect(cppPracticeBank.every((t) => slugs.has(t.skill))).toBe(true);
  });

  it("gives rung 1 a program to read and no harness; rungs 2–5 a function to write", () => {
    for (const t of [...cppPracticeBank, ...dsaPracticeBank]) {
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

describe("DSA practice bank", () => {
  it("has rungs 1–5 once each for every skill it covers, all of them DSA skills", () => {
    const slugs = new Set(dsaSkills.map((s) => s.slug));
    for (const skill of new Set(dsaPracticeBank.map((t) => t.skill))) {
      expect(slugs.has(skill), skill).toBe(true);
      expect(dsaPracticeBank.filter((t) => t.skill === skill).map((t) => t.rung).sort(), skill).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("shows a sample with its output; generated tests come last, at least two, with a brute force", () => {
    for (const t of dsaPracticeBank) {
      expect(t.cases[0].expected, t.title).toBeDefined();
      const first = t.cases.findIndex((c) => c.expected === undefined);
      if (first < 0) continue;
      expect(t.cases.slice(first).every((c) => c.expected === undefined), t.title).toBe(true);
      expect(t.cases.length - first, t.title).toBeGreaterThanOrEqual(2); // a medium test the brute force passes, then a large one
      expect(t.bruteForce, t.title).toBeTruthy();
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
