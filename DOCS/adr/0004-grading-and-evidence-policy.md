# ADR-0004: Grading verdicts, limits and evidence policy

- **Status:** Accepted in part (see Open)
- **Date:** 25 Sep 2026
- **Decided by:** Ashwani Kumar Puri
- **SRS links:** FR-M4-02, FR-M4-05, FR-M6-02, FR-M6-03, FR-M7-02, FR-M7-03, FR-M8-03, NFR-R2

## Verdict set
`AC` (all tests pass) · `WA` (wrong answer) · `CE` (compile error) · `RE` (runtime crash: segfault, abort, uncaught exception) · `TLE` (time limit exceeded) · `MLE` (memory limit exceeded, worked out by the adapter).

## How each verdict affects mastery
| Verdict | Counts as an attempt? | Effect on writing mastery |
|---|---|---|
| AC | Yes | Increases (formula not yet defined) |
| WA | Yes | Decreases by the WA penalty (amount not yet defined) |
| CE | **No** | **No change.** Fixing compile errors is treated as a trial-and-error lesson |
| CE, 3rd time on the **same exercise** | **Yes, from then on** | Plus a hint (see conflict below) |
| RE | Yes | **Counted as a mistake**; decreases writing mastery |
| TLE / MLE | Yes | **1/20 of the WA penalty**, **doubling** on each consecutive TLE/MLE, **capped at the WA penalty** |

- **Doubling reset:** it resets on "a single pass test, even brute force". It's not yet settled whether that means the whole submission accepted or a single test passing (Q11d).

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

## Conflicts to resolve
- **"CE ×3 → a hint"** conflicts with **FR-M8-03** (hints advance only when the student asks). **Q4b:** offer the hint instead of pushing it, or change the requirement?

## Open
- **Q10c:** minimum number of handwritten template exercises per skill and rung for the MVP. The template bank is now load-bearing, because every exercise that fails verification falls back to it.
- **Q11d:** the doubling-reset condition (above).
- The sizes of the WA penalty and of the AC gain. Both depend on the M4 update formula, which has to be defined in Phase 2.
