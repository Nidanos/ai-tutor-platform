# ADR-0003: Code execution runs on E2B, with our own judge adapter

- **Status:** Accepted
- **Date:** 25 Sep 2026, updated 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri

## Context
Requirements:
- C++ with a current compiler
- compile error, runtime error, time limit and memory limit reported separately
- no network access during a run
- managed rather than self-built (SRS §2.5, "we will not build our own sandbox")
- room for future full-stack exercises (Node, React, databases)

## Options considered (checked against vendor docs on 25 Sep 2026)
| | Judge0 (hosted CE) | Piston | E2B |
|---|---|---|---|
| Kind | Judge | Judge | General Linux sandbox |
| Newest C++ | GCC 9.2 (C++20 only partial, `-std=c++2a`) | gcc only; no clang package | Any compiler we install (clang 19) |
| Compile error / timeout / crash | Built in | Built in (`TO`, `SG`, `RE`, compile stage) | We classify them ourselves |
| Memory-limit status | None | None | None |
| Network off | Per submission (default on) | Default off | `allowInternetAccess: false` |
| Access | €27/mo hosted, or self-host | Public API closed to college/individual projects since 15 Feb 2026; self-host only (privileged Docker, cgroup v2) | Managed; free tier of 100 sandbox-hours/month |
| Future full-stack exercises | No (runs single programs) | No | Yes (dev servers, databases, ports) |

## Decision
**E2B**, with our own judge adapter in **M7's sandbox adapter** (`apps/api/src/infrastructure/sandbox/`).

- **Reason:** E2B is the only option that gives a current clang, keeps the sandbox managed (so the SRS "managed sandbox service" wording stays true), and leaves room for full-stack exercises later. The cost is that we build the judge layer ourselves.
- **History:** On 25 Sep, Piston was chosen first (12a) and E2B rejected because we would have to write the judge logic (12b). This was reversed after checking the docs: Piston's public API is not available to this project, it has no clang, and it reports no memory-limit status.
- **Sandbox lifecycle** *(13 Oct)*: **one sandbox per learner session**, reused across that learner's submissions and killed when idle. The work directory is wiped between runs. Reason: no start-up delay on every submit, and fewer of the free sandbox-hours used.
- **A failing sandbox is its own verdict, `SE`** *(13 Oct)*, so "the sandbox broke" is never confused with "the student's code failed" (NFR-R2). See ADR-0004.

## Consequences
- **We build the judge layer:** compile, run under limits, measure time and memory, then classify the result into AC / WA / CE / RE / TLE / MLE / SE.
- **None of the three services reports memory-limit exceeded.** Deriving MLE is our adapter's job whichever service is used.
- **All classification lives in the adapter,** which M7 calls (decision 12e). The rest of the code talks to a `SandboxProvider` interface, so E2B can be replaced by writing one class.
- **We keep a custom E2B template** with clang 19 installed.
- Every run, learner or verification, is recorded in `sandbox_runs` with per-test results in `run_test_results`.

## Open
- **Q12g:** the adapter mapping table, i.e. which exit code, signal, time or memory reading decides each verdict. To be settled in the E2B spike (Phase 3).
- Idle timeout before a learner's sandbox is killed.
