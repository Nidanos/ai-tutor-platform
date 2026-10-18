// The placement test's rules, v1 (FR-M3-01, ADR-0012). Pure: no database, recomputed from the stored
// answers on every call, so nothing about "the current question" is ever stored.
// Part 1 walks the skills easiest-first and asks each one's reading item (predict the output);
// Part 2 asks writing items only on the frontier of what was read correctly.
export const PLACEMENT_VERSION = "m3-v1";
export const KNOWN = 0.85; // clears the 0.7 unlock bar and sits in the rung-5 band (ADR-0011)

export type SkillNode = { id: string; slug: string; difficulty: number; prerequisites: { id: string }[] };
export type Item = { id: string; skillId: string; dimension: "reading" | "writing" };
export type Response = { itemId: string; isCorrect: boolean | null; dontKnow: boolean };
export type Placement<I extends Item = Item> = { skills: SkillNode[]; items: I[]; responses: Response[]; cleared: Set<string> };

// Every skill's transitive prerequisites.
function ancestorsOf(skills: SkillNode[]) {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const memo = new Map<string, Set<string>>();
  const walk = (id: string): Set<string> => {
    if (!memo.has(id)) {
      const direct = byId.get(id)?.prerequisites.map((p) => p.id) ?? [];
      memo.set(id, new Set(direct.flatMap((p) => [p, ...walk(p)])));
    }
    return memo.get(id)!;
  };
  skills.forEach((s) => walk(s.id));
  return memo;
}

// A prerequisite always has fewer ancestors than the skill built on it, so this is a valid topological order.
export function inOrder<T extends SkillNode>(skills: T[], ancestors = ancestorsOf(skills)) {
  const size = (s: T) => ancestors.get(s.id)!.size;
  return [...skills].sort((a, b) => size(a) - size(b) || a.difficulty - b.difficulty || a.slug.localeCompare(b.slug));
}

function analyse<I extends Item>({ skills, items, responses, cleared }: Placement<I>) {
  const ancestors = ancestorsOf(skills);
  const withAncestors = (ids: Iterable<string>) => new Set([...ids].flatMap((id) => [id, ...ancestors.get(id)!]));
  const itemOf = (skillId: string, dimension: Item["dimension"]) => items.find((i) => i.skillId === skillId && i.dimension === dimension); // newest first
  const responseTo = (item?: Item) => item && responses.find((r) => r.itemId === item.id);
  const correctIn = (dimension: Item["dimension"]) => skills.filter((s) => responseTo(itemOf(s.id, dimension))?.isCorrect).map((s) => s.id);
  // Getting a skill right shows its prerequisites can be done too.
  const passed = withAncestors([...cleared, ...correctIn("reading")]);
  return { ancestors, withAncestors, itemOf, responseTo, correctIn, passed, order: inOrder(skills, ancestors) };
}

// The next item to ask, or undefined when the test is done.
export function nextItem<I extends Item>(placement: Placement<I>): I | undefined {
  const { ancestors, withAncestors, itemOf, responseTo, passed, order } = analyse(placement);

  // Part 1. A skill whose prerequisite failed is never asked. A typed wrong answer may be a slip, so
  // the skill is only "suspect" until its first askable dependent checks it: right rescues it, wrong
  // confirms both. Only one check is ever asked: the walk stops at it until it is answered.
  const mark = new Map<string, "pass" | "open" | "suspect" | "fail">();
  for (const skill of order) {
    if (passed.has(skill.id)) {
      mark.set(skill.id, "pass");
      continue;
    }
    const prereqs = skill.prerequisites.map((p) => mark.get(p.id));
    if (prereqs.some((m) => !m || m === "fail")) continue; // blocked
    const suspects = skill.prerequisites.filter((p) => mark.get(p.id) === "suspect").map((p) => p.id);
    const item = itemOf(skill.id, "reading");
    if (!item) {
      if (!suspects.length) mark.set(skill.id, "open"); // nothing to ask: its dependents decide
      continue;
    }
    const response = responseTo(item);
    if (!response) return item;
    if (suspects.length) [skill.id, ...suspects].forEach((id) => mark.set(id, "fail"));
    else mark.set(skill.id, response.dontKnow ? "fail" : "suspect");
  }

  // Part 2. One writing task per frontier skill: one that no other passed skill builds on. An AC
  // vouches for everything below it, so asking lower skills would add time and no information.
  const prior = withAncestors(placement.cleared);
  const writable = order.filter((s) => passed.has(s.id) && !prior.has(s.id) && itemOf(s.id, "writing"));
  const covered = new Set(writable.flatMap((s) => [...ancestors.get(s.id)!]));
  return writable
    .filter((s) => !covered.has(s.id))
    .map((s) => itemOf(s.id, "writing")!)
    .find((item) => !responseTo(item));
}

// One estimate per skill the test covers (skills already cleared in practice are not). Passing in
// reading or writing seeds KNOWN; confidence is the share of the skill's two dimensions observed
// directly (0 = inferred only). Pending or SE writing counts as unobserved.
export function estimate(placement: Placement) {
  const { withAncestors, itemOf, responseTo, correctIn, passed, order } = analyse(placement);
  const vouched = withAncestors([...placement.cleared, ...correctIn("writing")]);
  const observed = (skillId: string, dimension: Item["dimension"]) => (responseTo(itemOf(skillId, dimension))?.isCorrect ?? null) !== null;
  return order.filter(({ id }) => !placement.cleared.has(id)).map(({ id }) => ({
    skillId: id,
    estReading: passed.has(id) ? KNOWN : 0,
    estWriting: vouched.has(id) ? KNOWN : 0,
    confidence: (Number(observed(id, "reading")) + Number(observed(id, "writing"))) / 2,
  }));
}
