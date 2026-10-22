# ADR-0023: Exercise generation covers C++ basics only, for the pilot

- **Status:** Accepted, built (23 Oct 2026)
- **Date:** 23 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **Links:** ADR-0016 (generation), ADR-0020 (the DSA bank)

## Context
The generation prompt (ADR-0016) describes the plain harness: `<iostream>`, `<string>` and one call per test, with every test written out. DSA exercises also use the shared generators (`gen::`), node structs, seeded large tests whose answers come from the reference, and a brute force that must agree on a medium test and time out on a large one (ADR-0020). A generated DSA exercise would either fail verification or pass with tests too weak to tell a fast solution from a slow one. Teaching the prompt and the draft schema all of this would take several days before billing starts on 7 Nov.

## Decision
1. **The `dsa` course is hand-written only.** `POST /exercises/generate` refuses its skills with `422 GENERATION_NOT_COVERED`, and the recommender's automatic jobs skip them without a sound.
2. **C++ basics generates as before**, inside the same budget and verification (ADR-0016).
3. **Courses are excluded by slug** (`HAND_WRITTEN_ONLY` in `request-generation.ts`), so a new course generates unless it is added there.

## Consequences
- DSA has every rung of every skill hand-written (245, ADR-0020), so the recommender always has something to serve. A learner who finishes all five of a skill's exercises gets a repeat, not a new variant.
- Frozen hints and live hints still cover DSA: they need no tests.
- Lifting this needs the prompt and draft schema to carry generated tests and a brute force, with ADR-0020's checks applied to drafts.
