# ADR-0013: Study sessions and the progress view, v1

- **Status:** Accepted, built
- **Date:** 19 Oct 2026
- **Decided by:** Ashwani Kumar Puri (pause/end endpoint, idle times, progress basis)
- **SRS links:** FR-M9-01 to FR-M9-03, FR-M11-01 to FR-M11-03

## Decisions made
1. **Pause, resume and end use one endpoint:** `PATCH /sessions/:id { status }`. The MVP grows from 22 to **23** endpoints.
2. **Idle times:** 15 minutes without activity pauses a session, and that gap is not counted as study time. 24 hours paused ends it, so the next visit starts fresh.
3. **Progress shows today's scores, after forgetting** (`effective`). The stored score is sent too. Nothing is rounded or adjusted (FR-M11-03).

## Sessions (M9)
| Rule | Detail |
|---|---|
| One open session per learner | `POST /sessions` resumes it (a paused one becomes active) or starts one. An open session for another course is ended first |
| Steps come from the recommender (FR-M9-02) | The current step is the session's one `active` step. Once its exercise is solved, the next call completes it and asks M5 for the next one. While the next skill has no exercise yet there is no step; a finished course ends the session (`completed`) |
| Resume at the same step (FR-M9-03) | Pausing never touches the step, so resuming continues exactly there |
| Time rules, applied when read | `session-clock.ts` (pure): idle → paused at the moment it went idle; paused for 24 h → ended (`idle`). No timer job is needed. `activeMs` counts only the time between activities on an active session |
| Ending is final | Changing an ended session gives `409 SESSION_ENDED` |

## Progress (M11)
`GET /progress` lists every skill of the course: reading and writing apart (stored and effective), its fade stage, its prerequisites (for the skill graph), and a status from **the same unlock rule as the recommender** (`isUnlocked`, `isReviewDue` in `recommend.ts`):

| Status | Meaning |
|---|---|
| `cleared` | Cleared in practice |
| `review_due` | Cleared, but effective writing has faded below 0.5 |
| `locked` | A prerequisite isn't cleared or at its writing level today |
| `in_progress` | Open, with evidence |
| `ready` | Open, never practised |

*(20 Oct)* `GET /progress` also returns `outside`: prerequisites from another course (C++ basics, for DSA), with that course and the learner's status there (`cleared`, `in_progress` or `not_started`).

## Not in v1
- Exercise attempts aren't linked to session steps (`session_step_id` stays null); a step is done when its exercise is solved, wherever it was solved.
- No per-session history endpoint; the rows are kept for research.
