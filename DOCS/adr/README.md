# Architecture Decision Records: AI Tutor

Last updated: 13 Oct 2026. These record decisions Ashwani has made. Where no decision has been made yet, the item is marked **Open** and stays open until he decides it.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-v1-domain-dsa.md) | v1 course is DSA, with a C++ basics track; own skill map, text + visuals, no videos | Accepted |
| [0002](0002-exercise-language-cpp20.md) | Language-agnostic exercises; C++20 on clang 19 first | Accepted |
| [0003](0003-sandbox-e2b-own-adapter.md) | E2B plus our own judge adapter, one sandbox per learner session | Accepted |
| [0004](0004-grading-and-evidence-policy.md) | Verdicts (incl. SE), limits, evidence policy, mutation check, M4 formula v1 | Accepted |
| [0005](0005-deterministic-system-llm-content.md) | LLM content, deterministic system: generate, validate, freeze | Accepted |
| [0006](0006-mvp-api-scope.md) | 22-API MVP | Accepted; M9 pause/resume open |
| [0007](0007-per-skill-scaffolding-fade.md) | Help fades per skill; clearing a skill; code retention | Accepted |
| [0008](0008-auth-tokens-and-sessions.md) | Short JWTs, rotating refresh tokens, cookies and Bearer | Accepted, built |
| [0009](0009-tech-stack-and-data.md) | Tech stack, versions and data choices | Accepted |

## Open decisions (Ashwani's to make)
| # | Question | Blocks |
|---|---|---|
| - | The DSA skill list, edges and resources (C++ basics done: 20 skills, 14 Oct) | Seed data, recommender |
| - | Visual format: Mermaid diagrams generated as text and frozen (recommended: cheap, deterministic, readable labels) or an image-generation model | Lesson content |
| - | Source to cross-check the DSA skill list (university syllabi) | DSA seed |
| - | Prerequisite threshold (0.7 is a placeholder) | Recommender |
| Q8 | Guide name (roll numbers and team rows are in the Phase 2 doc) | Phase-2 docs |
| Q10c | Minimum template exercises per skill and rung for the MVP | M6 fallback |
| Q12g | Adapter mapping table: signal or reading → verdict | M7 (E2B spike) |
| Q13 | One sentence: why Node suits this backend (see the note below) | Synopsis §5.2 rewrite |
| - | Whether a skill's fade stage can step back | M12 |
| - | Session idle and timeout values; sandbox idle timeout | M9, M7 |
| - | M9 pause, resume and end endpoints in the MVP list | ADR-0006 |
| - | Hosting provider within budget | Deployment |

## Resolved on 13 Oct
| # | Question | Answer | Where |
|---|---|---|---|
| Q2 | Phase-2 walking skeleton | Auth + database end to end | ADR-0008 |
| Q3 | Determinism mechanics | Generate, validate, freeze; hints pre-generated | ADR-0005 |
| Q4 | Redis client | `ioredis` only | ADR-0009 |
| Q4b | After 3 compile errors | Offer a hint, never push one | ADR-0004 |
| Q5 | Migration tool | Drizzle | ADR-0009 |
| Q6 | Auth libraries, test runner, LLM | argon2 + jose, Vitest, Gemini | ADR-0008, ADR-0009 |
| Q7 | SRS Musts outside the APIs | M2 seeded by script, M10 internal, M12 one endpoint | ADR-0006 |
| Q11d | What resets TLE doubling | Only an AC submission | ADR-0004 |
| - | C++ basics before DSA | A full `cpp-basics` course | ADR-0001 |
| - | E2B sandbox lifecycle | One per learner session, killed when idle | ADR-0003 |

**Note for Q13.** Almost everything the backend does is waiting: on Postgres, the LLM, or the sandbox. Node's event loop handles many waits cheaply on one thread. CPU-heavy work (compiling and running C++) happens inside the sandbox, not in Node. The sentence itself is Ashwani's to write.
