# ADR-0005: LLM-generated content, deterministic system

- **Status:** Principle accepted; mechanisms still to be decided (Phase 2)
- **Date:** 24–25 Sep 2026
- **Decided by:** Ashwani Kumar Puri

## Decided
- **All learning content is LLM-generated:** lessons, explanations, exercises, tests, hints.
- **The skill graph is authored by hand:** nodes and prerequisite edges.
- **The system is deterministic:** the same skill, rung and learner state always give the same content and the same grading outcome.
- **The claim to defend in the viva:** "The system is deterministic because generated content is validated and frozen, and nothing probabilistic sits in the grading or selection path." A single LLM call is never fully deterministic, even at temperature 0.
- **Grading never uses an LLM.** Verdicts come only from test execution in the sandbox (ADR-0003, ADR-0004).
- **Next-step selection stays rule-based** (FR-M5-04).
- **Test generators are seeded** (ADR-0004).
- **Compiler version and flags are part of `content_version`** (ADR-0002).

## Candidate mechanisms (Ashwani to decide)
- **Generate → validate → freeze.** Generate once, verify in the sandbox (ADR-0004), store with a version ID, and serve from the DB. Never regenerate for the same request.
- **Content key:** `(skill_id, rung, variant/seed, content_version)`.
- **Structured output only:** the LLM fills a fixed JSON schema, validated with zod before storage. Anything that fails validation is rejected.
- **Hints:** pre-generate each level per exercise and freeze them, **or** generate live and pass them through the output filter. **Undecided.**

## Consequences
- The synopsis wording "exercises are generated per learner and per difficulty rung" (§3.2) changes in the Phase-2 docs to "generated once, validated, frozen and served".
