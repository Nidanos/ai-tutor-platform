import { describe, expect, it } from "vitest";
import { cppBasicsSkills } from "../src/infrastructure/database/seed/cpp-basics.js";
import {
  estimate,
  inOrder,
  type Item,
  KNOWN,
  nextItem,
  type Placement,
  type Response,
} from "../src/modules/m3_diagnostic/services/placement.js";

// The real cpp-basics graph, with slugs as ids, and one reading and one writing item per skill.
const skills = cppBasicsSkills.map((s) => ({ id: s.slug, slug: s.slug, difficulty: s.difficulty, prerequisites: s.needs.map((id) => ({ id })) }));
const allItems: Item[] = skills.flatMap((s) => [
  { id: `${s.id}:reading`, skillId: s.id, dimension: "reading" as const },
  { id: `${s.id}:writing`, skillId: s.id, dimension: "writing" as const },
]);

type Learner = { knows: Set<string>; guesses?: boolean; slips?: Set<string>; items?: Item[]; cleared?: Set<string> };

// Plays the whole test as this learner: right on what they know, else "I don't know" or a wrong guess.
function take({ knows, guesses = false, slips = new Set(), items = allItems, cleared = new Set() }: Learner) {
  const placement: Placement = { skills, items, responses: [], cleared };
  const asked: Item[] = [];
  for (let item = nextItem(placement); item; item = nextItem(placement)) {
    asked.push(item);
    const right = knows.has(item.skillId) && !(item.dimension === "reading" && slips.has(item.skillId));
    placement.responses.push({ itemId: item.id, isCorrect: right, dontKnow: !right && !guesses });
  }
  const bySkill = new Map(estimate(placement).map((e) => [e.skillId, e]));
  const count = (dimension: Item["dimension"]) => asked.filter((i) => i.dimension === dimension).length;
  return { asked, bySkill, reading: count("reading"), writing: count("writing"), placement };
}

const firstN = (n: number) => new Set(cppBasicsSkills.slice(0, n).map((s) => s.slug));
const everything = new Set(skills.map((s) => s.id));

// Every set of skills a learner could know: whenever they know a skill, they know its prerequisites.
function allKnowledgeStates() {
  let states: Set<string>[] = [new Set()];
  for (const skill of inOrder(skills)) {
    states = states.flatMap((s) => (skill.prerequisites.every((p) => s.has(p.id)) ? [s, new Set([...s, skill.id])] : [s]));
  }
  return states;
}

describe("placement order", () => {
  it("puts every prerequisite before the skills built on it, easiest first", () => {
    const order = inOrder(skills).map((s) => s.id);
    for (const s of skills) for (const p of s.prerequisites) expect(order.indexOf(p.id)).toBeLessThan(order.indexOf(s.id));
    expect(order.slice(0, 5)).toEqual(["program-structure", "variables-and-types", "operators", "conditionals", "bitwise-operators"]);
  });
});

describe("placement walk", () => {
  it("ends after one item for a novice who doesn't know, and after the check for one who guesses", () => {
    expect(take({ knows: new Set() }).asked.map((i) => i.id)).toEqual(["program-structure:reading"]);
    expect(take({ knows: new Set(), guesses: true }).asked.map((i) => i.id)).toEqual(["program-structure:reading", "variables-and-types:reading"]);
  });

  it("asks writing only on the frontier of what was read correctly", () => {
    const beginner = take({ knows: firstN(3) });
    expect([beginner.reading, beginner.writing]).toEqual([5, 1]);
    expect(beginner.asked.at(-1)!.id).toBe("operators:writing");

    const mid = take({ knows: new Set([...firstN(9), "bitwise-operators"]) });
    expect(mid.asked.filter((i) => i.dimension === "writing").map((i) => i.skillId)).toEqual(["bitwise-operators", "strings", "vectors"]);

    const expert = take({ knows: everything });
    expect([expert.reading, expert.writing]).toEqual([20, 6]);
    expect(new Set(expert.asked.filter((i) => i.dimension === "writing").map((i) => i.skillId))).toEqual(
      new Set(["bitwise-operators", "strings", "container-adaptors", "associative-containers", "stl-algorithms", "smart-pointers"]),
    );
  });

  it("places all 711 possible learners exactly, within 20 reading and 7 writing items", () => {
    const states = allKnowledgeStates();
    expect(states).toHaveLength(711);
    for (const knows of states) {
      for (const guesses of [false, true]) {
        const { bySkill, reading, writing } = take({ knows, guesses });
        expect(reading).toBeLessThanOrEqual(20);
        expect(writing).toBeLessThanOrEqual(7);
        for (const s of skills) {
          const expected = knows.has(s.id) ? KNOWN : 0;
          expect([bySkill.get(s.id)!.estReading, bySkill.get(s.id)!.estWriting]).toEqual([expected, expected]);
        }
      }
    }
  });

  it("rescues a typed slip when the next skill is right, and confirms it when that is wrong too", () => {
    const slipped = take({ knows: everything, guesses: true, slips: new Set(["program-structure"]) });
    expect(slipped.bySkill.get("program-structure")!.estReading).toBe(KNOWN);
    expect(slipped.reading).toBe(20);

    const beginner = take({ knows: firstN(2), guesses: true }); // wrong on operators, then on its check
    expect(beginner.bySkill.get("operators")!.estReading).toBe(0);
    expect(beginner.asked.map((i) => i.skillId)).not.toContain("loops"); // blocked behind the confirmed miss
  });

  it("checks a suspect skill once: its other dependents wait for that check", () => {
    // Wrong on conditionals: its first dependent (functions) checks it; nothing else built on it is asked.
    const { asked } = take({ knows: firstN(3), guesses: true });
    const afterConditionals = asked.slice(asked.findIndex((i) => i.skillId === "conditionals") + 1).filter((i) => i.dimension === "reading");
    expect(afterConditionals.map((i) => i.skillId)).toEqual(["bitwise-operators", "functions"]);
  });

  it("never lets a writing verdict change which item comes next", () => {
    const { placement } = take({ knows: everything });
    const variants = [null, true, false].map((isCorrect) => ({
      ...placement,
      responses: placement.responses.slice(0, 22).map((r): Response => (r.itemId.endsWith("writing") ? { ...r, isCorrect } : r)),
    }));
    const next = variants.map((p) => nextItem(p)?.id);
    expect(new Set(next).size).toBe(1);
  });

  it("infers a skill with no reading item from its dependents, and moves the frontier below a missing writing item", () => {
    const noReading = allItems.filter((i) => i.id !== "operators:reading");
    expect(take({ knows: everything, items: noReading }).bySkill.get("operators")!.estReading).toBe(KNOWN);

    const noWriting = allItems.filter((i) => i.id !== "smart-pointers:writing");
    const targets = take({ knows: everything, items: noWriting }).asked.filter((i) => i.dimension === "writing").map((i) => i.skillId);
    expect(targets).toEqual(expect.arrayContaining(["dynamic-memory", "structs-and-classes"]));
    expect(targets).not.toContain("smart-pointers");
  });

  it("never asks or estimates skills already cleared in practice, but builds on them", () => {
    const cleared = firstN(5);
    const { asked, bySkill } = take({ knows: everything, cleared });
    expect(asked.some((i) => cleared.has(i.skillId))).toBe(false);
    expect(bySkill.has("loops")).toBe(false);
    expect(bySkill.size).toBe(15);
    expect(asked[0].skillId).toBe("bitwise-operators"); // the first skill not yet cleared
  });
});

describe("placement estimate", () => {
  it("lets one frontier AC vouch for every skill below it, at lower confidence", () => {
    const { bySkill } = take({ knows: everything });
    expect(bySkill.get("smart-pointers")).toMatchObject({ estWriting: KNOWN, confidence: 1 });
    expect(bySkill.get("pointers")).toMatchObject({ estReading: KNOWN, estWriting: KNOWN, confidence: 0.5 });
  });

  it("treats a pending or failed-to-run task as unobserved, and gives unreached skills nothing", () => {
    const placement: Placement = { skills, items: allItems, cleared: new Set(), responses: [] };
    for (const id of ["program-structure", "variables-and-types"]) placement.responses.push({ itemId: `${id}:reading`, isCorrect: true, dontKnow: false });
    placement.responses.push({ itemId: "variables-and-types:writing", isCorrect: null, dontKnow: false }); // still in the sandbox
    const bySkill = new Map(estimate(placement).map((e) => [e.skillId, e]));
    expect(bySkill.get("variables-and-types")).toEqual({ skillId: "variables-and-types", estReading: KNOWN, estWriting: 0, confidence: 0.5 });
    expect(bySkill.get("loops")).toEqual({ skillId: "loops", estReading: 0, estWriting: 0, confidence: 0 });
    expect(bySkill.size).toBe(20);
  });
});
