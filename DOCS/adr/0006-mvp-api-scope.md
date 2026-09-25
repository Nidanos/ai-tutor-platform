# ADR-0006: The MVP builds 18 REST APIs; the ~98-operation spec stays the long-term plan

- **Status:** Accepted, with open gaps
- **Date:** Sep 2026
- **Decided by:** Ashwani Kumar Puri

## Decision
Base path: `/api/v1`.

| Group | Endpoints |
|---|---|
| Auth | POST /auth/register · POST /auth/login · GET /auth/me |
| Diagnostic | POST /diagnostic/start · POST /diagnostic/:id/answers · POST /diagnostic/:id/complete |
| Mastery | GET /mastery · GET /mastery/:skillId · POST /mastery/evidence (**internal only**) |
| Recommender | GET /recommendations/next |
| Exercises | GET /exercises/:id · POST /exercises/generate |
| Submissions | POST /submissions · GET /submissions/:id/result |
| Hints | POST /exercises/:id/hints |
| Sessions | POST /sessions · GET /sessions/active |
| Progress | GET /progress |

- **`POST /mastery/evidence` must never be callable by a client.** Mastery updates only from inside the submission/grading path (FR-M4-02). If the endpoint is public, anyone can post fake evidence and inflate their mastery.
- **`DOCS/reference/ai-tutor-mvp.ts` is a reference stub,** used only as a map of endpoint shapes. It fakes grading, auth, storage and mastery, and it never goes into `apps/api`.

## Open: SRS "Must" requirements the 18 APIs don't cover (Q7)
- **M2:** no API to read or edit the skill graph. Seed the graph with a script for the MVP?
- **M10:** no review queue.
- **M12:** no scaffold fade.
- **M9:** sessions have no pause, resume or end, yet FR-M9-01 and FR-M9-03 are Must.
