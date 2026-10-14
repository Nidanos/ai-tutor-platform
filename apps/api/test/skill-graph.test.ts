import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
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
});
