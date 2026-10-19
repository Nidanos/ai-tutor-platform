import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import { dsaSkills } from "../src/infrastructure/database/seed/dsa.js";
import { findCycle } from "../src/modules/m2_skills/services/skill-graph.js";

const graph = (edges: Record<string, string[]>) => new Map(Object.entries(edges));

describe("skill graph", () => {
  it("finds a cycle", () => {
    expect(findCycle(graph({ a: ["b"], b: ["c"], c: ["a"] }))).toEqual(["a", "b", "c", "a"]);
  });

  it("accepts a graph where skills share prerequisites", () => {
    expect(findCycle(graph({ a: [], b: ["a"], c: ["a"], d: ["b", "c"] }))).toBeNull();
  });

  describe("cpp-basics seed data", () => {
    const slugs = new Set(cppBasicsSkills.map((s) => s.slug));

    it("has unique slugs and only known prerequisites", () => {
      expect(slugs.size).toBe(cppBasicsSkills.length);
      expect(cppBasicsSkills.flatMap((s) => s.needs).filter((need) => !slugs.has(need))).toEqual([]);
    });

    it("has no cycles", () => {
      expect(findCycle(new Map(cppBasicsSkills.map((s) => [s.slug, s.needs])))).toBeNull();
    });
  });

  describe("dsa seed data", () => {
    const own = new Set(dsaSkills.map((s) => s.slug));
    const cpp = new Set(cppBasicsSkills.map((s) => `cpp-basics/${s.slug}`));

    it("has unique slugs and names, and only known prerequisites, its own or C++ basics'", () => {
      expect(own.size).toBe(dsaSkills.length);
      expect(new Set(dsaSkills.map((s) => s.name)).size).toBe(dsaSkills.length);
      expect(dsaSkills.flatMap((s) => s.needs).filter((need) => !own.has(need) && !cpp.has(need))).toEqual([]);
    });

    it("has no cycles, even counting C++ basics, and builds on C++ basics from every root", () => {
      const both = new Map([
        ...cppBasicsSkills.map((s) => [`cpp-basics/${s.slug}`, s.needs.map((n) => `cpp-basics/${n}`)] as const),
        ...dsaSkills.map((s) => [s.slug, s.needs] as const),
      ]);
      expect(findCycle(both)).toBeNull();
      const roots = dsaSkills.filter((s) => s.needs.every((n) => !own.has(n)));
      expect(roots.map((s) => s.slug).sort()).toEqual(["complexity", "recursion"]);
      expect(roots.every((s) => s.needs.some((n) => cpp.has(n)))).toBe(true);
    });

    it("is never easier than what it builds on", () => {
      const difficulty = new Map(dsaSkills.map((s) => [s.slug, s.difficulty]));
      const inversions = dsaSkills.flatMap((s) => s.needs.filter((n) => (difficulty.get(n) ?? 0) > s.difficulty).map((n) => `${s.slug} < ${n}`));
      expect(inversions).toEqual([]);
    });
  });
});
