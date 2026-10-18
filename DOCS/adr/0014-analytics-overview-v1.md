# ADR-0014: Admin analytics overview, v1

- **Status:** Accepted, built
- **Date:** 19 Oct 2026
- **Decided by:** Ashwani Kumar Puri (contents, time window)
- **SRS links:** FR-M13-01 to FR-M13-03 (Should), ADR-0006

## Decision
`GET /analytics/overview?days=30&course=cpp-basics` is for **admins only** (`requireRole("ADMIN")`, otherwise `403 FORBIDDEN`). It returns **aggregate counts only**, never a learner's name, email or id. The window is `days` (1–365, default 30); totals such as "learners ever" stay all-time.

| Section | What it shows | Why |
|---|---|---|
| Learners & activity | Learners (total, joined in the window, ran code, awaiting a parent), live research and AI-training opt-ins, sessions and study minutes, placement tests started and completed | Is the pilot alive; the research sample size |
| Code runs | Submissions by verdict, median run time, sandbox error (SE) rate | Is E2B healthy |
| Learning outcomes | Skills cleared, fade-stage moves by cause, per skill: learners, average effective reading and writing, clears | The core claim: help fades and skills get cleared |
| Content coverage | Verified practice exercises per skill and rung; how many skills have none | Where generation is needed (skills without content are skipped by M5) |
| Hardest exercises | The 5 lowest solve rates among exercises with ≥ 3 practice attempts | A rate near 0 usually means a broken or unclear exercise |

**How the numbers are gathered:** each module owns a small aggregate query for its own tables, exposed through its service (`learnerStats` M1, `placementStats` M3, `skillStats`/`clearedSince` M4, `countServable` M6, `runStats`/`hardestExercises` M7, `sessionStats` M9, `stageMoves` M12). M13 only combines them. This keeps "modules never read each other's tables" without SQL views or a migration; the design note about views is replaced by this.

**First admin:** there is no admin sign-up. `pnpm --filter @ai-tutor/api user:admin <email>` promotes an existing account; that person logs in again (the role is in the access token).

## Not in v1 (added with the features they measure)
- **Calibration** (FR-M13-01): needs held-out exercises.
- ~~Hint trends (FR-M13-02) and AI spend vs the ₹500/month cap~~: added with hints on 19 Oct (ADR-0015).
- ~~Generation success by skill and rung (FR-M13-03)~~: added with generation on 19 Oct (ADR-0016).
