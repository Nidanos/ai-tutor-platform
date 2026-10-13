# ADR-0006: The MVP builds 22 REST APIs; the ~98-operation spec stays the long-term plan

- **Status:** Accepted
- **Date:** Sep 2026, updated 13 Oct 2026 (was 18 APIs)
- **Decided by:** Ashwani Kumar Puri

## Decision
Base path: `/api/v1`. Live endpoints are documented for the frontend in `DOCS/api/FRONTEND-GUIDE.md`.

| Group | Endpoints | Status |
|---|---|---|
| Auth | POST /auth/register · POST /auth/login · **POST /auth/refresh** · **POST /auth/logout** · GET /auth/me | **Live** |
| Diagnostic | POST /diagnostic/start · POST /diagnostic/:id/answers · POST /diagnostic/:id/complete | Planned |
| Mastery | GET /mastery · GET /mastery/:skillId | Planned |
| Recommender | GET /recommendations/next | Planned |
| Exercises | GET /exercises/:id · POST /exercises/generate · **GET /exercises/generation/:jobId** | Planned |
| Submissions | POST /submissions · GET /submissions/:id/result | Planned |
| Hints | POST /exercises/:id/hints | Planned |
| Sessions | POST /sessions · GET /sessions/active | Planned |
| Progress | GET /progress | Planned |
| Fade | **GET /scaffolding/state** | Planned |
| Analytics | **GET /analytics/overview** (admin only) | Planned |

**Bold** = added on 13 Oct:
- **refresh, logout:** short-lived access tokens need a refresh, and logout must revoke the refresh token (ADR-0008).
- **generation status:** the async fallback for exercise generation (ADR-0005).
- **scaffolding state:** per-skill fade is in the MVP (ADR-0007); fade evaluation stays internal.
- **analytics overview:** the analytics page is in the MVP, for the admin only.

- **Evidence recording is internal only** and never a client endpoint. Mastery changes only from inside the grading path (FR-M4-02); a public endpoint would let anyone inflate their own mastery.
- **`DOCS/reference/ai-tutor-mvp.ts` is a reference stub,** used only as a map of endpoint shapes. It never goes into `apps/api`.

## SRS "Must" requirements outside these APIs *(Q7, decided 13 Oct)*
- **M2 (FR-M2-03, skill-graph editing screen):** cut from the MVP with the admin panel. The graph is **seeded by script**; its 12 APIs are designed for later. A deliberate scope deviation.
- **M10 (review queue):** internal in the MVP. The recommender reads due reviews; no client endpoint.
- **M12 (fade):** one read endpoint; the rules run inside grading (ADR-0007).

## Open
- **M9 (FR-M9-01, FR-M9-03):** pause, resume and end-session endpoints. The database already supports them (session states, the single active step); the endpoints still need adding to the MVP list.
