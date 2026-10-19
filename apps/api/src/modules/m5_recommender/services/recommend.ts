// The M5 decision rules, v1 (FR-M5-01..05). Pure: no database, so every choice is testable and
// explainable. The LLM never chooses (FR-M5-04).
export const ALGORITHM_VERSION = "m5-v1";
const REVIEW_BELOW = 0.5; // a cleared skill whose effective writing decays below this is due for review
const WEIGHTS = { inProgress: 0.4, urgency: 0.4, goal: 0.2 };
const RUNG_BANDS: [minWriting: number, rung: number][] = [
  [0.65, 5],
  [0.45, 4],
  [0.25, 3],
];

export type SkillNode = {
  id: string;
  slug: string;
  difficulty: number;
  prerequisites: { id: string; minMastery: number }[];
};
export type SkillState = { reading: number; writing: number; cleared: boolean; attempts: number }; // effective scores
export type Candidate = {
  skill: SkillNode;
  reason: "new_skill" | "review";
  score: number;
  breakdown: Record<keyof typeof WEIGHTS, number>;
};

export const EMPTY: SkillState = { reading: 0, writing: 0, cleared: false, attempts: 0 };

// ADR-0011: a skill opens once each prerequisite is cleared, or still at its required writing level.
export const isUnlocked = (skill: SkillNode, stateOf: (id: string) => SkillState) =>
  skill.prerequisites.every((p) => stateOf(p.id).cleared || stateOf(p.id).writing >= p.minMastery);

// Nothing open because a prerequisite from another course is unmet (DSA waits on C++ basics): those
// prerequisites, for the skills that would be next. Empty when the course is simply done.
export function waitingOn(skills: SkillNode[], mastery: Map<string, SkillState>) {
  const stateOf = (id: string) => mastery.get(id) ?? EMPTY;
  const own = new Set(skills.map((s) => s.id));
  const met = (p: SkillNode["prerequisites"][number]) => stateOf(p.id).cleared || stateOf(p.id).writing >= p.minMastery;
  const next = skills.filter((s) => !stateOf(s.id).cleared && s.prerequisites.every((p) => !own.has(p.id) || met(p)));
  return [...new Set(next.flatMap((s) => s.prerequisites.filter((p) => !own.has(p.id) && !met(p)).map((p) => p.id)))];
}

export const isReviewDue = (state: SkillState) => state.cleared && state.writing < REVIEW_BELOW;

// FR-M5-05: the level comes from the writing score, but never below the fade stage's easiest rung.
export function rungFor(state: SkillState, minRung = 1) {
  const fromScore = RUNG_BANDS.find(([min]) => state.writing >= min)?.[1] ?? (state.reading > 0 || state.writing > 0 ? 2 : 1);
  return Math.max(fromScore, minRung);
}

// FR-M5-01..03: unlocked new skills and due reviews, best first. Finish what you started, then due
// reviews, then new skills; ties go to the easier skill.
export function rankCandidates(skills: SkillNode[], mastery: Map<string, SkillState>, goalSkillId: string | null): Candidate[] {
  const stateOf = (id: string) => mastery.get(id) ?? EMPTY;

  return skills
    .flatMap((skill): Candidate[] => {
      const state = stateOf(skill.id);
      const review = isReviewDue(state);
      if (!review && (state.cleared || !isUnlocked(skill, stateOf))) return [];
      const breakdown = {
        inProgress: !state.cleared && state.attempts > 0 ? 1 : 0,
        urgency: review ? (REVIEW_BELOW - state.writing) / REVIEW_BELOW : 0,
        goal: skill.id === goalSkillId ? 1 : 0,
      };
      const score = breakdown.inProgress * WEIGHTS.inProgress + breakdown.urgency * WEIGHTS.urgency + breakdown.goal * WEIGHTS.goal;
      return [{ skill, reason: review ? "review" : "new_skill", score, breakdown }];
    })
    .sort((a, b) => b.score - a.score || a.skill.difficulty - b.skill.difficulty || a.skill.slug.localeCompare(b.skill.slug));
}

export type ExerciseOption = { id: string; rung: number; attempt: "none" | "active" | "done" };

// The learner's unfinished attempt first, unless the skill's fade stage has since moved past its
// rung; else an unseen exercise at the rung, then harder, then easier down to the fade minimum.
// Undefined when this skill has nothing to serve yet.
export function pickExercise(options: ExerciseOption[], rung: number, minRung = 1) {
  const active = options.find((o) => o.attempt === "active" && o.rung >= minRung);
  if (active) return active;
  const harder = Array.from({ length: 5 - rung }, (_, i) => rung + 1 + i);
  const easier = Array.from({ length: Math.max(0, rung - minRung) }, (_, i) => rung - 1 - i);
  for (const r of [rung, ...harder, ...easier]) {
    const unseen = options.find((o) => o.rung === r && o.attempt === "none");
    if (unseen) return unseen;
  }
  return undefined;
}
