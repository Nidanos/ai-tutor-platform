# ADR-0007: Help fades per skill; clearing a skill; code retention

- **Status:** Accepted
- **Date:** 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **SRS links:** FR-M12-01, FR-M12-02, FR-M8-01

## Context
The project's core idea is deliberate scaffolding withdrawal: help is reduced on a plan until the learner works alone. The design had to settle what "doing it alone" means, whether help fades for the whole course or per skill, and how long learner code is kept.

## Decision
- **Clearing a skill** means an **AC on a rung-5 (Build) exercise of that skill, using 0 or 1 hint**. Build is a blank page, so this proves the learner can write it alone. Stored as `mastery_records.cleared_at`.
- **Help fades per skill**, not per course. Each skill sits on its own stage (`skill_scaffolding`), so a brand-new skill always starts with full help while a mastered one gets little.
- **A skill moves to its next stage when the learner solves that stage's rung with at most 1 hint.** Every move is recorded with the submission that caused it (`fade_stage_changes`), which is the research evidence that learners need less help over time.

| Stage | Easiest rung | Max hint level | Moves on when the learner solves |
|---|---|---|---|
| 1 | 1 Predict | 5 | rung 2 with ≤ 1 hint |
| 2 | 3 Complete | 4 | rung 3 with ≤ 1 hint |
| 3 | 4 Extend | 3 | rung 4 with ≤ 1 hint |
| 4 | 5 Build | 2 | rung 5 with ≤ 1 hint → **skill cleared** |

- The stage values are **data** (`fade_stages`), seeded as the default schedule and tunable without code changes. The hint ceilings (5, 4, 3, 2) are starting values.
- The starting stage of each skill is set from the diagnostic's writing estimate.
- **The ceiling is enforced by the database:** an attempt copies its hint ceiling from the stage, and a CHECK keeps `hint_level ≤ hint_ceiling` (FR-M12-02).
- **Code retention:** a learner's submitted answers are kept until they clear that skill, then emptied by a worker job (`answer_purged_at`). Verdicts, test results and evidence are kept, because they are the learning record and the research data.

## Consequences
- M12 is driven by grading results rather than by session ends.
- The fade has one client endpoint, `GET /scaffolding/state` (ADR-0006); the rules run inside grading.

## Open
- Whether a stage can ever step back, for example after repeated bottom-outs.
