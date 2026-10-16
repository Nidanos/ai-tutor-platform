# ADR-0004: Grading verdicts, limits and evidence policy

- **Status:** Accepted
- **Date:** 25 Sep 2026, updated 13 and 15 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **SRS links:** FR-M4-02, FR-M4-05, FR-M6-02, FR-M6-03, FR-M7-02, FR-M7-03, FR-M8-03, FR-M8-05, NFR-R2

## Verdict set
`AC` (all tests pass) · `WA` (wrong answer) · `CE` (compile error) · `RE` (runtime crash: segfault, abort, uncaught exception) · `TLE` (time limit exceeded) · `MLE` (memory limit exceeded, worked out by the adapter) · **`SE`** (sandbox error: the sandbox itself failed; added 13 Oct for NFR-R2).

## How each verdict affects mastery
| Verdict | Counts as an attempt? | Effect on writing mastery |
|---|---|---|
| AC | Yes | Increases (size set by the M4 formula) |
| WA | Yes | Decreases by the WA penalty (size set by the M4 formula) |
| CE | **No** | **No change.** Fixing compile errors is treated as a trial-and-error lesson |
| CE, 3rd time on the **same exercise** | **Yes, from then on** | The learner is **offered** a hint, never given one automatically |
| RE | Yes | **Counted as a mistake**; decreases writing mastery |
| TLE / MLE | Yes | **1/20 of the WA penalty**, **doubling** on each consecutive TLE/MLE, **capped at the WA penalty** |
| SE | **No** | **No change.** Not the learner's fault; the submission can be retried |

- **Doubling reset** *(13 Oct, resolves Q11d)*: only an **AC submission** resets it. Passing a single test does not, because a brute force passing the small tests would reset it every time.
- **Compile errors and hints** *(13 Oct, resolves Q4b)*: after the 3rd CE the system **offers** a hint and the learner accepts or declines. The hint level only moves when the learner asks, so FR-M8-03 stays intact.
- **Hint level 5** *(13 Oct)*: shows the frozen reference solution, never LLM text. It is logged as a bottom-out (FR-M8-05) and that attempt earns **no mastery credit**.
- **Clearing a skill** *(13 Oct)*: an AC on a rung-5 (Build) exercise of that skill using 0 or 1 hint. See ADR-0007.

## Time limits
- **Time limit = 3 × the slowest of several runs of the reference solution**, measured in the sandbox.
- **Minimum time limit = 100 ms (placeholder).** Replace it with a measured value: time an empty `main()` about 20 times in the sandbox.

## Test data and verification
- **Large tests** come from a **generator function stored with the exercise**, and the generator is **seeded** so the same tests are produced every time.
- **Mutation check.** The LLM also writes a deliberately slow (brute-force) solution. It is run and stored. An exercise is accepted only if:
  1. the reference solution passes every test within the limit,
  2. the brute force **passes the small tests** (proving it is correct, not broken), and
  3. the brute force **fails the big tests with TLE** (proving the tests can tell fast from slow).
- **If the tests can't tell fast from slow,** regenerate with a bigger n (max 2 retries). If that still fails, **discard the exercise and fall back to the template bank** (option (a), 25 Sep).

## M4 formula v1 *(approved 15 Oct; `formula_version = m4-v1`)*
```
AC:       new = old + 0.40 × weight × (1 − old)        weight = rung/5 × hints × time
WA / RE:  new = old × (1 − 0.15 × failWeight)           failWeight = (6 − rung)/5
TLE/MLE:  as WA, penalty 0.15/20 doubling per consecutive TLE/MLE, capped at 0.15
```
| Factor | Value |
|---|---|
| hints | 1 − 0.15 per hint used; hint level 5 (solution shown) = 0 |
| time | 1, falling to 0.7 when much slower than the rung's usual time (5/8/12/15/20 min, placeholders). 1 until sessions track active time |
| Dimension | Rung 1 (Predict) moves **reading**; rungs 2–5 move **writing** |
| Repeated WA/RE in one attempt | **Only the first is penalised**; debugging by trial isn't punished again |
| Counted CE (3rd+) | Counts in attempt totals, **no score change** |
| SE, early CE, diagnostic attempts | No evidence |

About five good solves (rungs 2→5) take a new skill from 0 to 0.72, just past the 0.7 prerequisite threshold. Code: `m4_mastery/services/mastery-formula.ts` (pure, unit-tested). The verdict and its evidence are saved in one transaction, with the mastery row locked.

## Template bank and verification *(built 16 Oct; resolves Q10c)*
- **MVP bank:** the first 5 C++ skills × rungs 1–5 = **25 hand-written exercises** (`seed/cpp-templates.ts`), plus "Sum of digits". More come from LLM generation; the bank is the fallback.
- **Rungs** follow the synopsis ladder: 1 Predict · 2 Diagnose · 3 Complete · 4 Extend · 5 Build. Rungs 2–5 use a `void solve(...)` box: inputs arrive as parameters, and the frozen harness owns `main()`.
- **Verification** (`m6_exercises/services/verify-exercise.ts`, run with `pnpm exercises:verify`): an exercise is served only if, in the real sandbox, the **reference passes every test** and the **starter code fails at least one** (the tests can tell a solution from a non-solution). Rung 1 runs the program and checks its output. Passing exercises are marked `verified`, failing ones `rejected`.
- **Seeded content is frozen:** to change an exercise, add a new variant.
- First run: **25 of 25 verified** on real E2B.
- The brute-force/TLE mutation check above applies to LLM-generated exercises with large tests; the hand-written bank has small tests only.
