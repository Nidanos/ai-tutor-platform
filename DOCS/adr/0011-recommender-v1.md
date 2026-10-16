# ADR-0011: Next-step recommender, v1 rules

- **Status:** Accepted, built
- **Date:** 17 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **SRS links:** FR-M5-01 to FR-M5-05, FR-M4-04

## Decision
The recommender (`GET /recommendations/next`) uses fixed rules, never an LLM (FR-M5-04). The rules live in one pure file, `m5_recommender/services/recommend.ts`, and every pick is saved with its score breakdown, the top 5 candidates and `algorithm_version = m5-v1`.

| Step | Rule |
|---|---|
| **Candidates** (FR-M5-01/02) | Skills whose prerequisites are each **cleared, or at effective writing ≥ the edge's `min_mastery` (0.7)**, and which aren't cleared yet. Plus **reviews**: cleared skills whose effective writing has decayed **below 0.5**. With λ = 0.05/day that's about a week after clearing; for concepts (λ = 0.02), about 2–3 weeks |
| **Score** (FR-M5-03) | 0.4 × *in progress* (started, not cleared) + 0.4 × *review urgency* ((0.5 − writing) / 0.5) + 0.2 × *the enrollment's goal skill*. Ties go to the lower difficulty, then the slug. The effect: **finish what you started, then due reviews, then new skills** |
| **Rung** (FR-M5-05) | From effective writing: ≥ 0.65 → 5, ≥ 0.45 → 4, ≥ 0.25 → 3; any evidence → 2; none → 1. **Never below the fade stage's easiest rung** (ADR-0007) |
| **Exercise** | The learner's **open attempt** on that skill first; else an **unseen** verified exercise at the rung, then harder rungs, then easier ones down to the fade minimum |
| **No content** | A candidate with nothing to serve is skipped for the next one, so learners never get stuck while the bank is small. If no candidate has content, the top one is returned with `exerciseId: null` (to be generated) |
| **Course done** | No candidates → `recommendation: null` |

**Why "cleared" also unlocks:** a skill is cleared at writing ≈ 0.72, just above 0.7, and it decays below 0.7 within a day. Without this rule, the next skill would lock again the day after clearing.

**Check:** with the M4 formula (ADR-0004), a new learner's rungs go **1 → 2 → 3 → 4 → 5** in five good solves (unit-tested), the journey approved on 15 Oct.

## Not in v1
- "Recency" (FR-M5-03) is covered only indirectly, through decay and review urgency. Add an explicit term if the pilot shows learners bouncing between skills.
- Reviews open as ordinary practice attempts until M10 (review scheduling) is built.
- Recommendation status (`accepted`, `completed`) isn't updated yet; the rows are the audit trail.

## Consequences
- The thresholds (0.5, 0.65 / 0.45 / 0.25) and weights are starting values, to be tuned with pilot data. Changing them means a new `m5-vN`.
- Exercises for skills 6–20 come from generation; until then those skills are skipped or returned without an exercise.
