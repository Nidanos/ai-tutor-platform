# Architecture Decision Records: AI Tutor

Last updated: 25 Sep 2026. These record decisions Ashwani has made. Where no decision has been made yet, the item is marked **Open** and stays open until he decides it.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-v1-domain-dsa.md) | v1 domain is DSA | Accepted |
| [0002](0002-exercise-language-cpp20.md) | C++20 on clang 19; function-level tests with a frozen harness | Accepted |
| [0003](0003-sandbox-e2b-own-adapter.md) | E2B plus our own judge adapter | Accepted |
| [0004](0004-grading-and-evidence-policy.md) | Verdicts, limits, evidence policy, mutation check | Accepted in part |
| [0005](0005-deterministic-system-llm-content.md) | LLM content, deterministic system | Principle accepted; mechanisms open |
| [0006](0006-mvp-api-scope.md) | 18-API MVP | Accepted, gaps open |

## Open decisions (Ashwani's to make)
| # | Question | Blocks |
|---|---|---|
| Q2 | Which end-to-end journey is the Phase-2 walking skeleton, and which APIs and module slices does it touch? | Phase 2 partial implementation (7 Oct) |
| Q3 | Determinism mechanics: freeze strategy, content key, whether hints are pre-generated or live (ADR-0005) | M6, M8 design |
| Q4 | Redis client: `redis` vs `ioredis` (BullMQ already uses ioredis) | Infrastructure |
| Q4b | After 3 compile errors: *offer* a hint, or change FR-M8-03? | ADR-0004 |
| Q5 | DB migration tool | Schema / ER |
| Q6 | Auth libraries (password hashing, JWT/session), test runner, LLM SDK | M1, testing |
| Q7 | SRS Must requirements outside the 18 APIs (M2, M9, M10, M12) | Scope |
| Q8 | Roll numbers, guide name, teammate rows | Phase-2 docs |
| Q10c | Minimum template exercises per skill and rung for the MVP | M6 fallback |
| Q11d | What resets TLE doubling: whole submission accepted, or one test passing? | ADR-0004 |
| Q12g | Adapter mapping table: signal or reading → verdict | M7 |
| Q13 | One sentence: why Node suits this backend (see the note below) | Synopsis §5.2 rewrite |
| - | Basic C++ root nodes or prerequisite check before DSA? | Skill graph |
| - | E2B sandbox lifecycle: per submission or reused? | M7 cost and latency |
| - | M4 update formula: AC gain, WA penalty size | M4, ADR-0004 |

**Note for Q13.** Almost everything the backend does is waiting: on Postgres, the LLM, or the sandbox. Node's event loop handles many waits cheaply on one thread. CPU-heavy work (compiling and running C++) happens inside the sandbox, not in Node. The sentence itself is Ashwani's to write.
