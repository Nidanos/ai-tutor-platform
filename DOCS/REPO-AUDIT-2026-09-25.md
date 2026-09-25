# Repo audit: `ai-tutor-platform` (25 Sep 2026)

Checked against three targets: **(1)** the 18-API MVP, **(2)** the ~98-operation spec, **(3)** the enterprise product (institutional licensing, synopsis §7.2).
**Nothing in the code was changed.** Every fix below is yours to make. The only files touched were `DOCS/` and one stack line in the root `README.md`.

## Verdict
The **shape is right**: a pnpm monorepo, one module folder per SRS module, a versioned `/api/v1`, Postgres with pgvector, Redis, and shared types.
It **does not run yet**: `pnpm dev` fails in both apps.
For the 98 APIs and the enterprise product, **four structural pieces are missing** (section D). The cheapest time to add them is before M1 is written.

## A. Fixed since last flagged
- [x] Moved out of OneDrive (now `C:\SoftwareEngineer\Workspace\Projects\ai-tutor-platform`)
- [x] `.gitkeep` in every empty folder
- [x] Postgres uses `pgvector/pgvector:pg16`
- [x] `.gitignore` present; `.env` and `.docker-data/` ignored

## B. Blockers: the MVP can't start
| # | Problem | Evidence |
|---|---|---|
| B1 | The API has no entry point | `apps/api/package.json` runs `tsx watch src/server.ts`, which doesn't exist. `app.ts` exports `app` but never calls `listen` |
| B2 | No `tsconfig.json` anywhere | Not at the root, not in `apps/api`, `apps/web` or `packages/types`. `pnpm build` (`tsc`) has nothing to compile against |
| B3 | The web app has nothing to serve | No `app/layout.tsx`, no `page.tsx`, no `next.config.*`. `@ai-tutor/types` exports raw `.ts`, so Next needs it listed in `transpilePackages` |
| B4 | Root `pnpm dev` does nothing | The root `package.json` has no `dev` script and no `"private": true`, but the README tells you to run `pnpm dev` |
| B5 | DB connection runs as a side effect | `infrastructure/database/index.ts` calls `testConnection()` at import time, so every import opens a query. Move it into the server's startup path |
| B6 | Secret committed to git | `docker-compose.yml` has `POSTGRES_PASSWORD: 2406` hard-coded, and it's pushed to `github.com/Nidanos/ai-tutor-platform`. Move it to env and change the password. There's also no `.env.example` |
| B7 | Line-ending churn | All 8 files `git status` shows as modified are **line-ending-only** changes (`git diff --ignore-cr-at-eol` is empty). Add a `.gitattributes` (e.g. `* text=auto eol=lf`) before your first real commit, or every diff will be noise |

## C. Decisions to make before writing code (yours)
| # | Item | Installed | Current (npm, 25 Sep) | Why it matters |
|---|---|---|---|---|
| C1 | Track `DOCS/` in git? | Ignored (commit `7b8411d`) | n/a | Synopsis §6.5 promises the ADRs, design and test docs "in the repository". Phase-2 ADRs need history |
| C2 | Express | ^4.18 | 5.2.1 | Express 5 forwards rejected promises from async handlers to your error middleware automatically. That changes how you write the build task |
| C3 | Next / React | ^14 / ^18 | 16.3 / 19.3 | The web app is empty, so upgrading now costs nothing. Later it costs a migration |
| C4 | zod | ^3.22 | 4.6 | The API changed between 3 and 4. Pick one before writing schemas |
| C5 | Redis client (Q4) | `redis` + `bullmq`, which brings `ioredis` | — | Two clients. Pick one |
| C6 | Node version | `@types/node` 20 | Node 24 LTS | Add `engines` and `.nvmrc` so the team and deployment match |
| C7 | TypeScript | ^5.3 | 7.0 | Pin one version for all packages |
| C8 | Not installed yet | — | — | Migration tool (Q5), password hashing and JWT (Q6), test runner, LLM SDK, `e2b` SDK, logger, env validation |

## D. Structure for 98 APIs and enterprise: what's missing
| # | Gap | Why it matters at 98 APIs / enterprise | Where the spec says so |
|---|---|---|---|
| D1 | **No repository or schema layer** in modules. Each has only `controllers/routes/services` | With 98 endpoints, SQL inside services becomes unmaintainable. Zod request/response schemas per module are your validation *and* your DTO contract | Spec §27 lifecycle: validation → controller → service → **repository** |
| D2 | **No worker process** | Generation, verification and sandbox runs are BullMQ jobs. Running them inside the API process means they can't scale separately | NFR-SC1; spec §25 queue diagram |
| D3 | **Empty `shared/`**: no auth/RBAC middleware, error class, response wrapper, logger or config | Every one of the 98 routes needs these. Build them once, before M1 | Spec §26 `shared/{auth,validation,errors,logging}`; §36 response format; NFR-S4 |
| D4 | **No tenant/organisation concept** | Institutional licensing sells seats to colleges and bootcamps. If `users` has no `org_id` from day 1, adding it later means migrating every table | Synopsis §7.2 |
| D5 | No `migrations/`, `tests/` or CI (`.github/workflows`) | Phase 3 requires testing; the synopsis promises unit tests for the mastery maths | Spec §26; synopsis §6.3 |
| D6 | `packages/config` is empty | Shared tsconfig and lint config belong here (fixes B2 once, for all packages) | README |
| D7 | `packages/types` is behind your decisions | `SubmissionVerdict.passed: boolean` can't express CE/RE/TLE/MLE (ADR-0004). `Exercise.tests: string` has no harness, generator, seed, brute force or `content_version` (ADR-0002/4/5) | ADRs |
| D8 | Route mount mismatch | The comment in `app.ts` mounts M8 at `/api/v1/hints`, but the MVP route is `POST /exercises/:id/hints` (ADR-0006) | ADR-0006 |

## E. Fine as is
- Module folders map 1:1 to M1–M13, so SRS traceability is straightforward.
- Next.js route groups `(auth)`, `(dashboard)`, `(admin)` separate roles cleanly (FR-M1-04 still has to be enforced server-side).
- The versioned base path `/api/v1` is already in place.
- The git remote is under the Nidanos org.

## Suggested order (your call)
1. **Hygiene** (B6, B7): no design needed.
2. **Pin versions** (C2–C7): a decision, not code.
3. **Make it boot** (B1–B5, D6): this *is* the Express build task, in the real repo.
4. **Lay the foundations** (D1, D3) before the first M1 route. D2 and D4 need decisions first.
