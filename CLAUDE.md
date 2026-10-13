# AI Tutor Platform: project rules

These rules apply to every change in this repo, by any person or AI tool.

## Code
- **Minimal.** If it can be done in 3 lines, don't write 30. No dead, speculative or "just in case" code.
- **DRY.** Extract a shared helper only when the repetition is real, not expected.
- **KISS.** Prefer a library feature or a plain function over a clever abstraction.
- **Modular.** Small focused files, one job each. Modules talk through services, never through each other's tables.
- **Readable.** Clear names over comments. Comment only the *why*, never the *what*.
- **YAGNI.** Add a table, enum, dependency or config only in the part that needs it.

## Where things are
- Design (source of truth): `DOCS/phase-2/MP3-System-Design.md`. Decisions: `DOCS/adr/`.
- API: `apps/api` (Express 5 + TypeScript). DB schema: `apps/api/src/infrastructure/database/schema/` (Drizzle, `snake_case` columns).
- Web: `apps/web` (Next.js). Shared contracts: `packages/types`.

## Workflow
- Build in small parts; each part runs and is checked before the next.
- Never edit an applied migration; generate a new one.
- Commits: `type: description` (feat, fix, refactor, docs, test, chore).
