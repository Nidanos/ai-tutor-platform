# ADR-0009: Tech stack, versions and data choices

- **Status:** Accepted
- **Date:** 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **Resolves:** open questions Q4 (Redis client), Q5 (migration tool), Q6 (auth libraries, test runner, LLM)

## Decision
| Area | Choice | Why |
|---|---|---|
| Versions | Latest stable, **pinned exactly** (no `^`): Express 5, Next 16, React 19, zod 4, Node 22 | Free to upgrade now, costly later; pinning keeps every machine identical. The project will run for years and gain a mobile app |
| TypeScript | **6.0.3**, not 7 | TypeScript 7 removed the compiler API that Next.js uses to type-check |
| Database | PostgreSQL 16 + pgvector | Relational skill graph and mastery data, vector search later, in one system |
| Schema + migrations | **Drizzle ORM** with `casing: 'snake_case'` | TypeScript schema, generated SQL migrations, typed queries; camelCase in code, snake_case in the database |
| Queue + Redis client | BullMQ with **`ioredis` only**; the `redis` package was removed | BullMQ needs ioredis anyway; one client, one config |
| LLM | **Google Gemini** behind one adapter (small model for hints, large for generation) | Budget of ₹1000–2000; the adapter makes a later switch a one-file change |
| Tests | **Vitest** + supertest, on a separate `ai_tutor_test` database | Fast, TypeScript-native; dev data is never touched |
| Auth libraries | `argon2`, `jose`, `cookie-parser`, `express-rate-limit` | See ADR-0008 |
| Organisations | **Kept.** Every learner belongs to one: a hidden personal organisation by default | Colleges can be added later with no schema change; it costs one column on `users` |
| Code rules | `CLAUDE.md` at the repo root: minimal, DRY, KISS, modular, YAGNI | Every person and AI tool on the repo follows the same rules |

## Consequences
- The design doc's schema (section 5) is implemented as 10 Drizzle migrations (`apps/api/drizzle/`); applied migrations are never edited.
- Multi-word unique columns get explicit constraint names, because drizzle-kit would otherwise emit camelCase names.
- Gemini's free-tier data terms must be checked before the college trial, since live hint prompts contain learner code.
