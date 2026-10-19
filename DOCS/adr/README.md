# Architecture Decision Records: AI Tutor

Last updated: 19 Oct 2026. These record decisions Ashwani has made. Where no decision has been made yet, the item is marked **Open** and stays open until he decides it.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-v1-domain-dsa.md) | v1 course is DSA, with a C++ basics track; own skill map, text + visuals, no videos | Accepted |
| [0002](0002-exercise-language-cpp20.md) | Language-agnostic exercises; C++20 on clang 19 first | Accepted |
| [0003](0003-sandbox-e2b-own-adapter.md) | E2B plus our own judge adapter, a fresh sandbox per submission | Accepted, built |
| [0004](0004-grading-and-evidence-policy.md) | Verdicts (incl. SE), limits, evidence policy, mutation check, M4 formula v1 | Accepted |
| [0005](0005-deterministic-system-llm-content.md) | LLM content, deterministic system: generate, validate, freeze | Accepted |
| [0006](0006-mvp-api-scope.md) | 23-API MVP | Accepted |
| [0007](0007-per-skill-scaffolding-fade.md) | Help fades per skill; clearing a skill; code retention | Accepted |
| [0008](0008-auth-tokens-and-sessions.md) | Short JWTs, rotating refresh tokens, cookies and Bearer | Accepted, built |
| [0009](0009-tech-stack-and-data.md) | Tech stack, versions and data choices | Accepted |
| [0010](0010-hosting-and-llm.md) | Oracle Always Free + Vercel hosting (with fallbacks); Gemini direct; frozen lessons + live tutor with spend caps | Accepted |
| [0011](0011-recommender-v1.md) | Recommender v1: candidates, score, rung from writing clamped to fade, exercise choice | Accepted, built |
| [0012](0012-diagnostic-v1.md) | Placement test v1: reading walk with a slip check, frontier code tasks, fast-track seeding, retakes | Accepted, built |
| [0013](0013-sessions-and-progress-v1.md) | Sessions (one PATCH for pause/resume/end, 15 min idle, 24 h end) and the progress view | Accepted, built |
| [0014](0014-analytics-overview-v1.md) | Admin analytics overview: aggregate counts per window, each from its owning module | Accepted, built |
| [0015](0015-hints-v1.md) | Hints: live tutor first (3.5 Flash Lite), frozen fallback, leak filter, caps, paid-tier safety switch | Accepted, built |
| [0016](0016-exercise-generation-v1.md) | Exercise generation: admin + automatic, ₹300/month, wrong answers must fail, Flash twice then Pro | Accepted, built |
| [0017](0017-password-reset-v1.md) | Password reset: Brevo email, one-use 30-minute link in the #fragment, logged out everywhere | Accepted, built |
| [0018](0018-data-rights-v1.md) | Data rights: correct, download, opt in and out, delete with the password after 7 days, anonymous numbers only with an opt-in | Accepted, built |

## Open decisions (Ashwani's to make)
| # | Question | Blocks |
|---|---|---|
| Q13 | One sentence: why Node suits this backend (see the note below) | Synopsis §5.2 rewrite |
| - | Whether a skill's fade stage can step back (also for diagnostic fast-tracks) | M12 |
| - | A cooldown between placement retakes (v1: 3 attempts, none) | M3 |

## Resolved on 20 Oct
| # | Question | Answer | Where |
|---|---|---|---|
| - | The DSA skill list, edges and resources | 49 skills in 8 groups, basics to advanced, building on C++ basics across courses | ADR-0001 |
| - | Source to cross-check the DSA skill list | GGSIPU MCA-102 and MCA-201, then widened to working knowledge | ADR-0001 |

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
