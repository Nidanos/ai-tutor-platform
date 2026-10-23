# ADR-0003: Code execution runs on E2B, with our own judge adapter

- **Status:** Accepted
- **Date:** 25 Sep 2026, updated 13 and 14 Oct 2026
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
| Access | €27/mo hosted, or self-host | Public API closed to college/individual projects since 15 Feb 2026; self-host only (privileged Docker, cgroup v2) | Managed; Hobby plan: $100 one-time credit, then per-second billing (checked 14 Oct) |
| Future full-stack exercises | No (runs single programs) | No | Yes (dev servers, databases, ports) |

## Decision
**E2B**, with our own judge adapter in **M7's sandbox adapter** (`apps/api/src/infrastructure/sandbox/`).

- **Reason:** E2B is the only option that gives a current clang, keeps the sandbox managed (so the SRS "managed sandbox service" wording stays true), and leaves room for full-stack exercises later. The cost is that we build the judge layer ourselves.
- **History:** On 25 Sep, Piston was chosen first (12a) and E2B rejected because we would have to write the judge logic (12b). This was reversed after checking the docs: Piston's public API is not available to this project, it has no clang, and it reports no memory-limit status.
- **Sandbox lifecycle** *(14 Oct, replaces 13 Oct)*: **one fresh sandbox per submission**: create → compile → run tests → kill. E2B bills every second a sandbox is alive, so a per-session sandbox would also be billed while the learner reads or thinks: about ₹4.60 vs ₹0.25 for a 30-minute session with 20 submits. A fresh machine per run also means nothing leaks between runs, and there is no sandbox tracking code. The cost is about 1 s of start-up per submit.
- **Queue** *(14 Oct)*: the API saves the submission and returns `202`; a **BullMQ worker** runs it with retries, limited to 1 new sandbox per second (the E2B Hobby limit). The client polls for the verdict. *(23 Oct, after a load check: up to 10 run at once, of Hobby's 20, since a run takes 5–10 s; and a rung-1 answer, which needs no sandbox, is graded in the request instead of waiting in the queue. 20 code submissions sent at once all passed, the last within about 30 s.)*
- **Default limits** *(14 Oct)*: per test **2 s** and **256 MB**; compile **10 s**; sandbox 2 vCPU / 512 MiB. Stored per exercise (`time_limit_ms`, `memory_limit_mb`), so an exercise can override them.
- **The judge compares outputs outside the sandbox** *(14 Oct)*: each test runs as its own process (`./main <test number>`), and the judge compares its stdout with the expected output kept on the server. If the harness inside the sandbox decided pass or fail, learner code could print "PASS" and exit.
- **A failing sandbox is its own verdict, `SE`** *(13 Oct)*, so "the sandbox broke" is never confused with "the student's code failed" (NFR-R2). See ADR-0004.

## Consequences
- **We build the judge layer:** compile, run under limits, measure time and memory, then classify the result into AC / WA / CE / RE / TLE / MLE / SE.
- **None of the three services reports memory-limit exceeded.** Deriving MLE is our adapter's job whichever service is used.
- **The sandbox adapter only runs code and returns readings** (exit code, time, memory, output); **M7's judge classifies them** (decision 12e). The rest of the code talks to a `SandboxProvider` interface, so E2B can be replaced by writing one class.
- **We keep a custom E2B template** with clang 19 installed.
- Every run, learner or verification, is recorded in `sandbox_runs` with per-test results in `run_test_results`.

## Verdict mapping (Q12g, settled 14 Oct)
Checked per test, in this order. The first failing test decides the submission's verdict.

| Verdict | Rule |
|---|---|
| CE | The compiler exits non-zero or takes longer than 10 s (no test runs) |
| TLE | The test was killed by the time limit |
| MLE | Peak memory above the limit, or the program died with `std::bad_alloc` |
| RE | Any other non-zero exit or signal (segfault, divide by zero, abort) |
| WA | Output differs from the expected output (trailing spaces, line endings and blank lines at the end are ignored) |
| AC | Every test passes |
| SE | E2B or our own setup failed (no sandbox, API error, no tests). Retried once by the worker; no mastery effect |

The rules live in one pure function (`m7_execution/services/judge.ts`), unit-tested without E2B.

## How a run works (built 15 Oct)
- **Template `ai-tutor-cpp`**: Debian 13, clang 19.1.7, GNU `time`; 2 vCPU / 512 MiB. Built from `infrastructure/sandbox/template.ts` with `pnpm sandbox:build`. A warm-up compile during the build keeps clang and the headers in the snapshot's memory.
- **Three round trips**: create the sandbox, write the files, then one command that compiles and runs every test. Each test is `timeout` + `prlimit --as` (memory limit + 64 MB slack) + `/usr/bin/time` for peak memory. Results come back as one line per test with base64 output; tests stop after the first crash or time-out. The sandbox is killed in the background.
- **Measured**: about 3.5–7 s per submission, mostly network round trips to E2B (compiling takes about 0.5 s inside the sandbox). Next speed-up if needed: send small files inside the command instead of a separate write.
- **Check**: `pnpm sandbox:smoke` runs six solutions against real E2B and expects AC, WA, CE, RE, TLE and MLE.
- **Known limit**: learner code runs as the same user as our script, so a determined learner could fork a process that tampers with result lines. That's acceptable for practice; the fix later is a separate run user.
