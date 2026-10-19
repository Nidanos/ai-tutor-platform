# ADR-0012: Placement test (diagnostic), v1 rules

- **Status:** Accepted, built
- **Date:** 18 Oct 2026
- **Decided by:** Ashwani Kumar Puri (coverage, pass rule, question types: 17 Oct)
- **SRS links:** FR-M3-01 to FR-M3-03, FR-M4-02, ADR-0004, ADR-0007, ADR-0011

## Decisions made
1. The test covers **all 20 skills** of `cpp-basics`.
2. **Fast-track on a pass:** a skill proven in the test starts on the last fade stage (Build, at most 2 hints) and unlocks the skills built on it. The test never clears a skill. One Build solved with at most 1 hint clears it in practice.
3. **Reading = predict the output** (typed, compared like rung 1). The answer key is the program's real output, checked in the sandbox when the item is verified.
4. **Writing = one small function per skill**, run in the sandbox in the background while the next question shows.

## Rules
The order, walk, frontier and estimate rules are in one pure file, `m3_diagnostic/services/placement.ts` (`m3-v1`). They are recomputed from the stored answers on every call, so "the current question" is never stored. Seeding is in M4 `mastery.service.ts` and M12 `scaffolding.service.ts`; the 120 s wait and the 3-attempt cap are in `diagnostic.service.ts`.

| Step | Rule |
|---|---|
| **Order** | Easiest first: by the number of transitive prerequisites, then difficulty, then slug. A prerequisite always comes before its dependents |
| **Part 1, reading** | Ask each skill's reading item in order. A skill whose prerequisite was missed is never asked. A right answer passes the skill **and all its prerequisites** |
| **Slip check** | "I don't know" is a miss. A *typed* wrong answer may be a slip, so the skill is "suspect" until its first askable dependent is answered. A right answer there rescues it; a wrong one confirms both misses |
| **Part 2, writing** | Only the **frontier**: passed skills that no other passed skill builds on. An AC vouches for the skill and everything below it, so lower tasks would add time and no information. Writing verdicts never change which question comes next |
| **Estimates** | Passed in reading → `est_reading` 0.85; vouched by a writing AC → `est_writing` 0.85; else 0. `confidence` = the share of the skill's two dimensions observed directly (0, 0.5 or 1). SE or a task not run within 120 s counts as unobserved |
| **Seeding** (one transaction) | M4 `seedFromDiagnostic` raises each dimension to 0.85 only if that beats today's effective score by at least 0.01. Evidence rows have `diagnostic_id` as their source. Attempt counts and `cleared_at` are never touched. Then M12 `startAtLastStage` for every skill with writing 0.85, never moving a stage down. Skills already **cleared** in practice are not asked, not estimated and not touched; skills below them count as known |
| **Retake** | `POST /start { retake: true }`, up to **3 attempts** per enrollment. Seeding is raise-only, so a retake can lift a placement but never lowers one |

**Why 0.85:** it clears the 0.7 unlock bar, it sits in the rung-5 band (≥ 0.65), and it stays ≥ 0.7 for 3.9 days (syntactic skills) or 9.7 days (conceptual skills).

**Length (simulated on the real graph):**

| Learner | Questions | Time |
|---|---|---|
| Novice who doesn't know skill 1 | 1 | about 1 min |
| Knows skills 1–3 | 5 reading + 1 writing | about 11 min |
| Knows 10 skills | 15 + 3 | about 23 min |
| Expert | 20 + 6 | about 28 min (a naive 20 + 20 would take 75–80 min) |

Unit tests run every one of the **711** knowledge states the graph allows. With no slips, each is placed exactly, in at most 20 reading and 7 writing questions.

## Safety
- The answer key never leaves the server: reading items carry no key, diagnostic exercises are never served as practice, and per-question correctness is not returned while the test runs.
- **An idempotency key returns only a submission made on the same attempt.** Otherwise a learner could submit a solved practice exercise under the code task's predictable key and be placed without writing code.
- A retried answer reuses its first submission (key `diagnostic:<id>:<item>`), and only a submission on the same exercise.

## Accepted in v1
- Per-skill results are visible on the results page, so retakes can be "learned". The limits are the 3-attempt cap, the sandbox AC and the Build still needed to clear.
- A seed unlocks dependents only while it stays ≥ 0.7. After about 4 days (syntactic skills) the learner confirms skills bottom-up, one Build each, as in ADR-0011. Possible v2: let a skill on its last stage unlock as well.
- On day 0, M5's tie-break can serve the learner's next *new* skill before the fast-tracked Builds. Both are fine starting points.
- An answer racing a complete in another tab can land after completion and is ignored.
- Writing items run only once (one submission). A CE counts as a miss, and a missed frontier task is not followed down: the skills below it start unproven in writing (reading still counts). A retake can lift them.
- The judge sees only output, so a determined learner can sometimes avoid a prerequisite (e.g. rewrite a struct to use a vector, or skip freeing memory). The tasks are designed so the natural solution uses the prerequisites; every item was attacked with common wrong solutions in the sandbox.
- One reading and one writing item per skill. A corrected item supersedes the old one once verified (newest wins).
- No goal is set here yet (enrollment `goal_skill_id`), so M5's goal weight stays 0 until goal-setting is built.

- *(20 Oct)* The test covers its own course: prerequisites from another course (C++ basics, for DSA) are left out of the walk. That course has its own placement test, and the recommender still enforces them.

## Open (Ashwani's to decide)
- Should a fast-tracked skill ever step back a stage (e.g. 3 failed Builds)? v1 never steps back (as ADR-0007).
- Should retakes have a cooldown (e.g. 24 h)? v1: 3 attempts, no cooldown.
