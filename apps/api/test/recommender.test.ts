import { describe, expect, it } from "vitest";
import { applyEvidence } from "../src/modules/m4_mastery/services/mastery-formula.js";
import {
  type ExerciseOption,
  pickExercise,
  rankCandidates,
  rungFor,
  type SkillNode,
  type SkillState,
} from "../src/modules/m5_recommender/services/recommend.js";

// A chain: first → second → third, each needing the previous at writing 0.7.
const skill = (id: string, needs: string[] = [], difficulty = 1): SkillNode => ({
  id,
  slug: id,
  difficulty,
  prerequisites: needs.map((p) => ({ id: p, minMastery: 0.7 })),
});
const COURSE = [skill("first"), skill("second", ["first"]), skill("third", ["second"])];
const state = (s: Partial<SkillState>): SkillState => ({ reading: 0, writing: 0, cleared: false, attempts: 0, ...s });
const ranked = (mastery: Record<string, Partial<SkillState>>, goal: string | null = null) =>
  rankCandidates(COURSE, new Map(Object.entries(mastery).map(([id, s]) => [id, state(s)])), goal).map((c) => `${c.skill.id}:${c.reason}`);

describe("recommender rules v1", () => {
  it("starts a new learner on the first skill only", () => {
    expect(ranked({})).toEqual(["first:new_skill"]);
  });

  it("unlocks the next skill once a prerequisite is cleared, even if it has decayed a little", () => {
    expect(ranked({ first: { writing: 0.66, cleared: true, attempts: 5 } })).toEqual(["second:new_skill"]);
  });

  it("finishes the skill in progress before a due review, and does due reviews before new skills", () => {
    const cleared = { writing: 0.4, cleared: true, attempts: 5 }; // decayed below 0.5: due
    expect(ranked({ first: cleared, second: { writing: 0.3, attempts: 2 } })).toEqual(["second:new_skill", "first:review"]);
    expect(ranked({ first: cleared })).toEqual(["first:review", "second:new_skill"]);
  });

  it("prefers the learner's goal skill among equals, and reports nothing when the course is done", () => {
    const COURSE_FORK = [skill("a"), skill("b")];
    const goalFirst = rankCandidates(COURSE_FORK, new Map(), "b").map((c) => c.skill.id);
    expect(goalFirst).toEqual(["b", "a"]);
    const done = { writing: 0.8, cleared: true, attempts: 5 };
    expect(ranked({ first: done, second: done, third: done })).toEqual([]);
  });

  it("follows the approved journey: rung 1 → 2 → 3 → 4 → 5 in five good solves", () => {
    let s = state({});
    let minRung = 1;
    const rungs: number[] = [];
    const advanceStage = (rung: number) => (minRung = Math.max(minRung, [1, 3, 3, 4, 5, 5][rung])); // fade: solve stage rung → next stage
    for (let solve = 0; solve < 5; solve++) {
      const rung = rungFor(s, minRung);
      rungs.push(rung);
      const update = applyEvidence(rung === 1 ? s.reading : s.writing, 0, { verdict: "AC", rung, hintsUsed: 0, activeMs: 0, isRepeatFailure: false });
      s = rung === 1 ? { ...s, reading: update.score, attempts: s.attempts + 1 } : { ...s, writing: update.score, attempts: s.attempts + 1 };
      if (rung >= 2) advanceStage(rung);
    }
    expect(rungs).toEqual([1, 2, 3, 4, 5]);
  });

  it("never goes below the fade stage's easiest rung", () => {
    expect(rungFor(state({}), 3)).toBe(3);
    expect(rungFor(state({ writing: 0.7 }), 3)).toBe(5);
  });

  it("picks the unfinished attempt first, then unseen at the rung, then harder, then easier", () => {
    const options = (list: [string, number, ExerciseOption["attempt"]][]) => list.map(([id, rung, attempt]) => ({ id, rung, attempt }));
    expect(pickExercise(options([["a", 2, "none"], ["b", 4, "active"]]), 2)?.id).toBe("b");
    expect(pickExercise(options([["a", 3, "none"], ["b", 2, "none"]]), 2)?.id).toBe("b");
    expect(pickExercise(options([["a", 2, "done"], ["b", 4, "none"], ["c", 1, "none"]]), 2)?.id).toBe("b");
    expect(pickExercise(options([["a", 2, "done"], ["c", 1, "none"]]), 2)?.id).toBe("c");
    expect(pickExercise(options([["c", 1, "none"]]), 3, 3)).toBeUndefined(); // below the fade minimum
    expect(pickExercise(options([["a", 1, "active"], ["b", 5, "none"]]), 5, 5)?.id).toBe("b"); // an attempt the stage has outgrown
  });
});
