# ADR-0022: The review queue, v1: worked out on read, no stored rows

- **Status:** Accepted, built (the rule has run since ADR-0011; this records it and changes the design to match)
- **Date:** 23 Oct 2026
- **Decided by:** Ashwani Kumar Puri (the simpler of the two, since it already works)
- **Links:** ADR-0004 (decay), ADR-0006 (M10 internal), ADR-0007 (clearing), ADR-0011 (recommender), ADR-0018 (data rights), FR-M4-04, FR-M10-01, FR-M10-02

## Context
The design gave M10 a table, `review_items`, filled by a scheduled decay scan: a row when a skill's effective mastery falls below the threshold, with a due date, and the recommender reading those rows. None of that was built. Instead the recommender has worked reviews out from mastery since ADR-0011, and `/progress` shows them with the same rule. The design and the code disagree, so one of them has to change before the final report.

## Decision
1. **A review is due when a cleared skill's effective writing is below 0.5** (`isReviewDue` in M5). The rule reads M4's scores, decayed to now, and stores nothing, so the queue can't go stale or drift from mastery, and no job has to keep it up to date.
2. **No decay scan.** The worker gets no scheduled job for reviews. Every reader sees the same answer at the same moment, so the result stays deterministic.
3. **The due date can be worked out from the same numbers** (FR-M10-01): a skill cleared with writing *s* at its last evidence is due ln(*s* / 0.5) / λ days later. `/progress` already gives `review_due` as a status. If the reviews screen shows "due in N days", `/progress` adds that date, worked out the same way, and still stores nothing.
4. **The recommender reads the rule directly** (FR-M10-02): due reviews compete with new skills by urgency (ADR-0011), and a session step for one has `kind = review`.
5. **A review is an ordinary practice attempt.** Its evidence counts the same (ADR-0004), it can move the fade stage (ADR-0007), and a first try at an exercise still saves a calibration record (ADR-0021). The recommendation's `reason` and the session step's `kind` say it was a review, so analysis can tell reviews apart without `context = review`.
6. **What ends a review:** practice that lifts effective writing back to 0.5 or above. A miss lowers writing further, so the skill stays due and moves up the queue. The skill stays cleared either way.
7. **`review_items` stays in the schema, unused.** Dropping it needs a migration, and its columns (`interval_days`, `ease`, reasons `manual` and `failed_prereq`) fit a later spaced-repetition M10. When something writes to it, that module adds its export and erase steps (ADR-0018).

## Consequences
- Only cleared skills are reviewed, and only on writing. A skill still in progress that decays just keeps its lower score, and the recommender serves it as unfinished work. Reading decays, but alone it never makes a review due.
- With λ = 0.05 a day, a review comes about a week after clearing (ADR-0011), so the three-day pilot will see few or none. The recommender and progress tests cover the rule with decayed scores.
- Not in v1: spaced intervals that grow after each successful review, reviews a learner asks for, and reviewing a prerequisite after a failure on a later skill. Each needs stored state, and this is where `review_items` would come back.
