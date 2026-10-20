# ADR-0020: The DSA exercise bank, v1

- **Status:** Accepted, being built. Verification is built; skills are written group by group (complexity first, 20 Oct)
- **Date:** 20 Oct 2026
- **Decided by:** Ashwani Kumar Puri (five per skill, speed tests where a slow version exists)
- **Links:** ADR-0004 ("Test data and verification"), ADR-0016, ADR-0019

## Decisions made
1. **Five hand-written exercises per DSA skill**, one per rung (Predict, Diagnose, Complete, Extend, Build), as for C++ basics: 245 in all, in `seed/dsa-exercises/<slug>.ts`. Every rung exists, so the recommender can always serve a DSA skill; generation adds variants later.
2. **Speed tests where a slow version exists.** A task with a slow-but-correct solution (most DSA tasks) gets large seeded tests and a brute force. A task without one, such as reversing a linked list, keeps small tests that wrong answers fail. Rung 1 never has them: the learner only reads.

## Generated tests
- A test with no expected output is **generated**. Its arguments are a C++ expression that builds the input, such as `gen::ints(2, 1000000, 0, 1)`. The expected output comes from the reference at verification, and is stored then (`size = large`).
- `seed/dsa-exercises/harness.ts` holds the shared generator code (`gen::`), placed in the harness after the learner's file. It has its own random generator (splitmix64), so the same seed gives the same data whatever the standard library. `gen::show` prints a short vector in full, and a long one as its size and a checksum, so outputs stay small.
- Order: the small hand-written tests first (the first is the sample), then a **medium** generated test, then a **large** one. The sandbox stops at the first failing test, so a brute force must meet the medium test before it times out on the large one.

## Verification (`verify-exercise.ts`), added to ADR-0004 and ADR-0016
| Check | Rule |
|---|---|
| Reference | Passes every small test. Its output becomes each generated test's expected output |
| Time headroom | With generated tests, the reference's slowest test takes at most a third of the time limit (ADR-0004's "3 × the reference"); the limit stays 2 s |
| Starter | Compiles and fails a test. A slow starter fails by timing out, so "make it fast enough" works as a rung-2 task |
| Brute force | Required when there are generated tests. It passes every small test, **agrees** with the reference on at least one generated test, and then **times out**. Disagreeing or crashing rejects the exercise (`brute_force`), and finishing every test in time means the tests can't tell fast from slow (`tests_too_weak`) |

The brute force checks the reference on data no one wrote by hand, and proves that the large tests need the fast idea.

## Writing them
- Each exercise uses only its skill and that skill's prerequisites, across courses (DSA builds on C++ basics).
- None reuses a lesson's example or check (ADR-0019).
- `pnpm db:seed` stores drafts, and `pnpm exercises:verify` runs them in the real sandbox, as for C++ basics. A unit test checks the bank's shape: five rungs per skill, a sample with its output, generated tests last and at least two, and a brute force wherever they appear.

## Notes
- The sandbox measures time in steps of 10 ms. The fast references so far finish a million values in under 10 ms.
- DSA placement items come after the bank.
