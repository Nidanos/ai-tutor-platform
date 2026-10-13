# ADR-0005: LLM-generated content, deterministic system

- **Status:** Accepted
- **Date:** 24–25 Sep 2026, mechanisms decided 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri

## Decided
- **All learning content is LLM-generated:** lessons, explanations, exercises, tests, hints.
- **The skill graph is authored by hand:** nodes and prerequisite edges.
- **The system is deterministic:** the same skill, rung and learner state always give the same content and the same grading outcome.
- **The claim to defend in the viva:** "The system is deterministic because generated content is validated and frozen, and nothing probabilistic sits in the grading or selection path." A single LLM call is never fully deterministic, even at temperature 0.
- **Grading never uses an LLM.** Verdicts come only from test execution in the sandbox (ADR-0003, ADR-0004).
- **Next-step selection stays rule-based** (FR-M5-04), with a fixed tie-break, and every recommendation stores its scores and `algorithm_version`.
- **Test generators are seeded** (ADR-0004).
- **Compiler version and flags are part of `content_version`** (ADR-0002).

## Mechanisms *(decided 13 Oct)*
- **Generate → validate → freeze.** Generate once, verify in the sandbox (ADR-0004), store with a version, and serve from the database. A verified exercise is never edited; a change is a new row with a new `content_version`.
- **Content key:** `(skill_id, language_code, rung, variant_seed, content_version)`, unique in the database.
- **Structured output only:** Gemini fills a fixed JSON schema, validated with zod before anything is stored. Anything that fails validation is rejected and logged in `generation_failures`.
- **Hints are pre-generated** for all 5 levels when an exercise is frozen, so the same exercise always gives the same hints. Level 5 is the reference solution. Live generation, through the output filter, is only a fallback when a stored hint is missing.
- **Exercises are pre-generated** in the background, so the learner never waits. When nothing is ready, the recommender serves a template exercise and queues generation; an async job with a status endpoint is the fallback path.
- **Mastery maths is versioned:** every evidence row stores the `formula_version` that produced it.

## Consequences
- The synopsis wording "exercises are generated per learner and per difficulty rung" (§3.2) changes in the Phase-2 docs to "generated once, validated, frozen and served".
