# ADR-0004: Grading verdicts, limits and evidence policy

- **Status:** Accepted (the M4 formula sizes are still open)
- **Date:** 25 Sep 2026, updated 13 Oct 2026
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

## Open
- **M4 formula:** the size of the AC gain and the WA penalty, and how rung, hints and time weight them (FR-M4-05).
- **Q10c:** minimum number of handwritten template exercises per skill and rung for the MVP. The template bank is load-bearing, because every exercise that fails verification falls back to it.
