# AI Tutor — API Specification & Module-wise API Plan

## Project

> AI Tutor: An Evidence-Based Adaptive Learning System with Deliberate Scaffolding Withdrawal

> **Status note (25 Sep 2026).** This spec is the long-term plan (~98 operations). The following decisions apply on top of it; see `DOCS/adr/`:
> - **Domain:** DSA, not JS→React (ADR-0001).
> - **Exercises:** C++20 on clang 19, function-level tests with a frozen harness (ADR-0002).
> - **M7 execution:** E2B plus our own judge adapter. Verdicts are AC / WA / CE / RE / TLE / MLE, not only pass/fail (ADR-0003, ADR-0004).
> - **MVP:** 18 of these APIs (ADR-0006). `POST /mastery/evidence` is internal only.
> - **M6:** generated content is validated and frozen before serving (ADR-0004 mutation check, ADR-0005).

## Purpose of this document

This document defines the recommended backend API surface for the AI Tutor V1 implementation. It translates the 13 functional modules and functional requirements in the Software Requirements Specification (SRS) into a practical REST/API architecture.

The SRS defines system behaviour and requirements; it does not prescribe exact endpoint names. Therefore, endpoint naming and the API decomposition in this document are implementation recommendations designed to satisfy the SRS without changing its core design principles.

---

## 1. API Architecture Overview

The recommended base path is:

```text
/api/v1
```

Suggested resource groups:

```text
/api/v1
│
├── /auth
├── /users
├── /skills
├── /diagnostic
├── /mastery
├── /recommendations
├── /exercises
├── /submissions
├── /hints
├── /sessions
├── /reviews
├── /progress
├── /scaffolding
└── /analytics
```

The frontend communicates with the backend using HTTPS/REST and JSON.

Internal processing should use application/domain services rather than exposing every internal operation as a public endpoint.

---

## 2. API Access Classification

| Symbol | Type | Meaning |
| --- | --- | --- |
| 🟢 | Learner API | Called by learner-facing frontend |
| 🟠 | Author/Admin API | Restricted to curriculum authors or administrators |
| 🔵 | Internal API | Backend module/service-to-service operation |
| ⚙️ | Background Job | Executed asynchronously by workers/queues |

Important: a module can have internal service operations without those operations becoming public HTTP endpoints.

---

## 3. Overall API Count

The recommended detailed service/API map contains approximately **98 operations**.

| Module | Name | Recommended Operations |
| --- | --- | ---: |
| M1 | Authentication & Account Management | 8 |
| M2 | Skill Graph Management | 12 |
| M3 | Diagnostic Assessment | 6 |
| M4 | Learner Mastery Model | 9 |
| M5 | Next-Step Recommender | 6 |
| M6 | Exercise Generation & Validation | 9 |
| M7 | Sandboxed Execution & Grading | 7 |
| M8 | Socratic Response Engine | 7 |
| M9 | Session Orchestration | 8 |
| M10 | Spaced Repetition Scheduler | 6 |
| M11 | Progress & Mastery Visualisation | 6 |
| M12 | Scaffolding Fade Controller | 6 |
| M13 | Calibration & Analytics | 8 |
| **Total** | | **98** |

This is an engineering decomposition, not a requirement that every operation must be implemented as an independently exposed public REST endpoint.

---

## 4. M1 — Authentication & Account Management

### SRS responsibility

M1 handles registration, login, session management, learner profile/goal configuration and role-based access.

SRS requirements:

- FR-M1-01: learner registration
- FR-M1-02: authentication and sessions for Learner, Author and Admin
- FR-M1-03: capture learner goal
- FR-M1-04: role-based access control
- FR-M1-05: credential reset

### API 1 — Register

```http
POST /api/v1/auth/register
```

**Access:** 🟢 Public

**Purpose:** Creates a new user account.

**Request:**

```json
{
  "email": "learner@example.com",
  "password": "********",
  "name": "Learner"
}
```

**Used for:**

- Creating the user record
- Creating learner profile
- Assigning the Learner role by default
- Starting the authenticated user lifecycle

---

### API 2 — Login

```http
POST /api/v1/auth/login
```

**Access:** 🟢 Public

**Purpose:** Authenticates a user and creates an authenticated session.

**Response example:**

```json
{
  "accessToken": "...",
  "user": {
    "id": "user-id",
    "role": "LEARNER"
  }
}
```

---

### API 3 — Logout

```http
POST /api/v1/auth/logout
```

**Access:** 🟢 Authenticated

**Purpose:** Invalidates the current authenticated session/token.

---

### API 4 — Current User

```http
GET /api/v1/auth/me
```

**Access:** 🟢 Authenticated

**Purpose:** Returns the current user's identity, role and profile information.

---

### API 5 — Update Learner Profile

```http
PATCH /api/v1/users/me
```

**Access:** 🟢 Learner

**Purpose:** Updates learner profile information and stated learning goal.

The learner's stated goal is an input to M5's recommendation scoring.

---

### API 6 — Change Password

```http
POST /api/v1/auth/change-password
```

**Access:** 🟢 Authenticated

**Purpose:** Allows a logged-in user to change credentials.

---

### API 7 — Forgot Password

```http
POST /api/v1/auth/forgot-password
```

**Access:** 🟢 Public

**Purpose:** Starts credential recovery.

---

### API 8 — Reset Password

```http
POST /api/v1/auth/reset-password
```

**Access:** 🟢 Public with reset token

**Purpose:** Completes credential recovery.

#### M1 total: 8 operations

---

## 5. M2 — Skill Graph Management

### SRS responsibility M2

M2 stores and manages the prerequisite skill DAG, skill metadata and authoring operations.

Important constraints:

- Skill relationships form a directed acyclic graph.
- Graph edits that introduce cycles must be rejected.
- Skills have decay-relevant type metadata.
- Authoring is restricted to the appropriate role.

### API 1 — Get Skill Graph

```http
GET /api/v1/skills/graph
```

**Access:** 🟢 / 🟠

**Purpose:** Returns the complete skill graph.

**Used by:**

- Learner progress view
- Recommender
- Authoring UI

---

### API 2 — List Skills

```http
GET /api/v1/skills
```

**Purpose:** Returns skills with optional filtering.

Example:

```text
?status=active
?type=syntactic
?type=conceptual
```

---

### API 3 — Get Skill

```http
GET /api/v1/skills/:skillId
```

**Purpose:** Returns one skill and its metadata.

---

### API 4 — Create Skill

```http
POST /api/v1/skills
```

**Access:** 🟠 Author/Admin

**Purpose:** Creates a skill node.

---

### API 5 — Update Skill

```http
PATCH /api/v1/skills/:skillId
```

**Access:** 🟠 Author/Admin

**Purpose:** Updates skill metadata.

---

### API 6 — Deprecate Skill

```http
DELETE /api/v1/skills/:skillId
```

**Access:** 🟠 Author/Admin

**Implementation recommendation:** Treat this as a soft-deprecation operation so historical mastery/exercise records remain valid.

---

### API 7 — Add Prerequisite

```http
POST /api/v1/skills/:skillId/prerequisites
```

**Access:** 🟠 Author/Admin

**Purpose:** Adds a directed prerequisite edge.

---

### API 8 — Remove Prerequisite

```http
DELETE /api/v1/skills/:skillId/prerequisites/:prerequisiteId
```

**Access:** 🟠 Author/Admin

---

### API 9 — Validate Graph

```http
POST /api/v1/skills/graph/validate
```

**Access:** 🟠 Author/Admin

**Purpose:** Checks whether a graph edit is valid and acyclic before publication.

---

### API 10 — Get Prerequisites

```http
GET /api/v1/skills/:skillId/prerequisites
```

**Purpose:** Returns all prerequisite skills.

---

### API 11 — Get Dependents

```http
GET /api/v1/skills/:skillId/dependents
```

**Purpose:** Returns skills that depend on the selected skill.

---

### API 12 — Graph History

```http
GET /api/v1/skills/graph/history
```

**Access:** 🟠 Author/Admin

**Priority:** Could

**Purpose:** Shows graph-edit history if V1 implements version history.

#### M2 total: 12 operations

**MVP recommendation:** APIs 1–11 are useful; API 12 can be postponed.

---

## 6. M3 — Diagnostic Assessment

### SRS responsibility M3

M3 establishes the learner's initial position in the graph and estimates reading and writing scores separately.

The diagnostic result seeds M4.

### API 1 — Start Diagnostic

```http
POST /api/v1/diagnostic/start
```

**Purpose:** Creates a diagnostic attempt.

---

### API 2 — Get Current Question

```http
GET /api/v1/diagnostic/:diagnosticId/question
```

**Purpose:** Returns the current diagnostic item.

---

### API 3 — Submit Answer

```http
POST /api/v1/diagnostic/:diagnosticId/answers
```

**Purpose:** Records the learner's response and determines the next adaptive diagnostic item.

---

### API 4 — Diagnostic Progress

```http
GET /api/v1/diagnostic/:diagnosticId/progress
```

**Purpose:** Shows completion state.

---

### API 5 — Complete Diagnostic

```http
POST /api/v1/diagnostic/:diagnosticId/complete
```

**Purpose:** Finalizes the diagnostic and triggers M4 mastery seeding.

Flow:

```text
Diagnostic completed
        ↓
DiagnosticResult
        ↓
M4 Mastery Seed
```

---

### API 6 — Retake Diagnostic

```http
POST /api/v1/diagnostic/retake
```

**Priority:** Should

**Purpose:** Starts a new diagnostic attempt.

#### M3 total: 6 operations

---

## 7. M4 — Learner Mastery Model

### M4 is the central learning-state module

M4 stores mastery per learner and per skill.

A mastery record includes:

```text
reading score
writing score
last supporting evidence timestamp
attempt count
success count
decay constant
```

Mastery must be updated only from executed evidence, not from merely reading, watching or marking content complete.

### API 1 — Get All Mastery

```http
GET /api/v1/mastery
```

**Access:** 🟢 Learner

**Purpose:** Returns mastery state across the learner's skill graph.

---

### API 2 — Get Skill Mastery

```http
GET /api/v1/mastery/:skillId
```

**Purpose:** Returns reading, writing and effective mastery for a skill.

Example:

```json
{
  "skillId": "functions",
  "readingMastery": 0.82,
  "writingMastery": 0.61,
  "effectiveMastery": 0.57
}
```

---

### API 3 — Get Effective Mastery

```http
GET /api/v1/mastery/:skillId/effective
```

**Purpose:** Calculates the currently effective mastery after time decay.

---

### API 4 — Mastery History

```http
GET /api/v1/mastery/:skillId/history
```

**Purpose:** Returns historical evidence/mastery changes.

Useful for:

- Progress charts
- Debugging
- Research evaluation

---

### API 5 — Record Evidence

```http
POST /api/v1/mastery/evidence
```

**Access:** 🔵 Internal

**Purpose:** Sends validated learning evidence to M4.

Example:

```json
{
  "learnerId": "user-id",
  "skillId": "functions",
  "evidenceType": "EXERCISE_SUCCESS",
  "rung": 4,
  "hintsUsed": 1,
  "timeTaken": 85
}
```

---

### API 6 — Update Mastery

```http
POST /api/v1/mastery/update
```

**Access:** 🔵 Internal

**Purpose:** Applies the mastery update algorithm to validated evidence.

This should not be directly callable by the learner frontend.

---

### API 7 — Calculate Decay

```http
GET /api/v1/mastery/:skillId/decay
```

**Purpose:** Returns effective mastery based on elapsed time and the skill's decay constant.

---

### API 8 — Weak Skills

```http
GET /api/v1/mastery/weak
```

**Purpose:** Identifies skills with weak effective mastery.

Used by:

- Progress dashboard
- Review scheduling
- Recommendation logic

---

### API 9 — Seed From Diagnostic

```http
POST /api/v1/mastery/seed
```

**Access:** 🔵 Internal

**Purpose:** Converts M3 diagnostic results into initial M4 mastery records.

#### M4 total: 9 operations

---

## 8. M5 — Next-Step Recommender

### SRS responsibility M5

M5 deterministically selects the learner's next skill/step.

Candidate scoring considers:

- Prerequisite readiness
- Learner goal relevance
- Decay-derived urgency
- Recency of coverage
- Review queue
- Current writing mastery for rung selection

The LLM must not choose the next skill.

### API 1 — Get Next Recommendation

```http
GET /api/v1/recommendations/next
```

**Access:** 🟢 Learner

**Purpose:** Returns the current recommended learning step.

This is one of the most important learner-facing APIs.

---

### API 2 — Generate Recommendation

```http
POST /api/v1/recommendations/generate
```

**Access:** 🔵 Internal

**Purpose:** Runs the deterministic candidate-selection and scoring process.

---

### API 3 — Get Candidate Skills

```http
GET /api/v1/recommendations/candidates
```

**Purpose:** Returns skills eligible for recommendation.

---

### API 4 — Explain Recommendation

```http
GET /api/v1/recommendations/:recommendationId/explanation
```

**Purpose:** Provides an auditable reason for the selected step.

Example:

```text
Selected because:
- prerequisites are ready
- relevant to learner goal
- writing mastery is weak
- review urgency is high
```

---

### API 5 — Recommendation History

```http
GET /api/v1/recommendations/history
```

**Purpose:** Provides recommendation history for debugging/research.

---

### API 6 — Select Difficulty Rung

```http
POST /api/v1/recommendations/:recommendationId/rung
```

**Access:** 🔵 Internal

**Purpose:** Determines rung 1–5 from current writing mastery.

#### M5 total: 6 operations

---

## 9. M6 — Exercise Generation & Validation

### SRS responsibility M6

M6 generates exercises for the selected skill and rung using the large-tier language model.

Every generated exercise must be self-verified by executing the reference solution against generated tests. Failed generation/verification falls back to an authored template bank.

### API 1 — Get Exercise

```http
GET /api/v1/exercises/:exerciseId
```

**Purpose:** Returns exercise content to the learner.

---

### API 2 — Generate Exercise

```http
POST /api/v1/exercises/generate
```

**Access:** 🔵 / ⚙️

**Purpose:** Creates an exercise-generation job.

---

### API 3 — Generation Status

```http
GET /api/v1/exercises/generation/:jobId
```

**Purpose:** Returns asynchronous generation status.

---

### API 4 — Validate Exercise

```http
POST /api/v1/exercises/:exerciseId/validate
```

**Access:** 🔵 / ⚙️

**Purpose:** Validates generated exercise correctness.

---

### API 5 — Verify Reference Solution

```http
POST /api/v1/exercises/:exerciseId/verify
```

**Access:** 🔵 / ⚙️

**Purpose:** Executes the reference solution against generated tests before the exercise is served.

---

### API 6 — List Templates

```http
GET /api/v1/exercises/templates
```

**Access:** 🟠 Author/Admin

**Purpose:** Retrieves authored fallback exercises/templates.

---

### API 7 — Create Template

```http
POST /api/v1/exercises/templates
```

**Access:** 🟠 Author

---

### API 8 — Update Template

```http
PATCH /api/v1/exercises/templates/:templateId
```

**Access:** 🟠 Author

---

### API 9 — Record Generation Failure

```http
POST /api/v1/exercises/generation-failures
```

**Access:** 🔵 Internal

**Purpose:** Records generation/verification failure for M13 analytics.

#### M6 total: 9 operations

---

## 10. M7 — Sandboxed Execution & Grading

### SRS responsibility M7

M7 executes learner-submitted code inside an isolated, network-disabled and resource-capped environment.

It runs the exercise test suite and produces structured verdicts.

### API 1 — Create Submission

```http
POST /api/v1/submissions
```

**Access:** 🟢 Learner

**Request:**

```json
{
  "exerciseId": "exercise-id",
  "code": "function solution() { ... }"
}
```

**Purpose:** Creates a submission and queues execution.

---

### API 2 — Get Submission

```http
GET /api/v1/submissions/:submissionId
```

**Purpose:** Returns submission metadata/status.

---

### API 3 — Get Submission Result

```http
GET /api/v1/submissions/:submissionId/result
```

**Purpose:** Returns final grading result.

---

### API 4 — Execute Submission

```http
POST /api/v1/submissions/:submissionId/execute
```

**Access:** 🔵 / ⚙️

**Purpose:** Sends code to the managed sandbox.

---

### API 5 — Run Tests

```http
POST /api/v1/submissions/:submissionId/test
```

**Access:** 🔵 / ⚙️

**Purpose:** Runs the submission against the exercise test suite.

---

### API 6 — Get Test Results

```http
GET /api/v1/submissions/:submissionId/tests
```

**Purpose:** Returns individual test outcomes.

---

### API 7 — Report Evidence

```http
POST /api/v1/submissions/:submissionId/evidence
```

**Access:** 🔵 Internal

**Purpose:** Converts grading outcome into validated evidence for M4.

#### M7 total: 7 operations

---

## 11. M8 — Socratic Response Engine

### SRS responsibility M8

M8 provides graduated hints while structurally preventing the system from immediately giving away the solution.

Critical requirements:

- Current hint level stored server-side
- Only current level transmitted
- Hint level advances only after explicit request
- Generated output is filtered
- Bottoming-out is recorded

### Hint ladder

```text
Level 1 → Concept
Level 2 → Location
Level 3 → Mechanism
Level 4 → Worked example
Level 5 → Answer
```

### API 1 — Request Hint

```http
POST /api/v1/exercises/:exerciseId/hints
```

**Access:** 🟢 Learner

**Purpose:** Requests the next permitted hint.

The server determines which hint level is allowed.

---

### API 2 — Get Hint State

```http
GET /api/v1/exercises/:exerciseId/hints/state
```

**Purpose:** Returns current permitted hint state.

---

### API 3 — Advance Hint Level

```http
POST /api/v1/exercises/:exerciseId/hints/advance
```

**Access:** 🔵 / controlled learner action

**Purpose:** Advances the stored hint level after an explicit learner request.

---

### API 4 — Generate Hint

```http
POST /api/v1/hints/generate
```

**Access:** 🔵 Internal

**Purpose:** Calls the small-tier model to generate content for exactly the permitted level.

---

### API 5 — Filter AI Response

```http
POST /api/v1/hints/filter
```

**Access:** 🔵 Internal

**Purpose:** Checks generated content for solution-shaped code matching the exercise target.

---

### API 6 — Record Bottom-Out

```http
POST /api/v1/hints/bottom-out
```

**Access:** 🔵 Internal

**Purpose:** Records when the hint ladder reaches its final level.

---

### API 7 — Hint History

```http
GET /api/v1/exercises/:exerciseId/hints/history
```

**Purpose:** Returns hint consumption history for the current attempt.

#### M8 total: 7 operations

---

## 12. M9 — Session Orchestration

### SRS responsibility M9

M9 controls:

- Session lifecycle
- Step sequencing
- Progress persistence
- Resume after interruption

### API 1 — Start Session

```http
POST /api/v1/sessions
```

**Purpose:** Creates a learner session.

---

### API 2 — Active Session

```http
GET /api/v1/sessions/active
```

**Purpose:** Finds the learner's current active session.

---

### API 3 — Get Session

```http
GET /api/v1/sessions/:sessionId
```

---

### API 4 — Pause Session

```http
POST /api/v1/sessions/:sessionId/pause
```

---

### API 5 — Resume Session

```http
POST /api/v1/sessions/:sessionId/resume
```

---

### API 6 — End Session

```http
POST /api/v1/sessions/:sessionId/end
```

---

### API 7 — Current Step

```http
GET /api/v1/sessions/:sessionId/current-step
```

**Purpose:** Returns the exact step where the learner currently is.

---

### API 8 — Complete Step

```http
POST /api/v1/sessions/:sessionId/steps/:stepId/complete
```

**Purpose:** Persists step completion state.

Important: completing a content step must not itself update mastery. Mastery updates come from evidence.

#### M9 total: 8 operations

---

## 13. M10 — Spaced Repetition Scheduler

### SRS responsibility M10

M10 derives review due dates from M4's decay model and exposes review candidates to M5.

### API 1 — Review Queue

```http
GET /api/v1/reviews
```

**Purpose:** Returns learner's review queue.

---

### API 2 — Due Reviews

```http
GET /api/v1/reviews/due
```

**Purpose:** Returns skills currently due for review.

---

### API 3 — Upcoming Reviews

```http
GET /api/v1/reviews/upcoming
```

**Purpose:** Returns upcoming review items.

---

### API 4 — Schedule Review

```http
POST /api/v1/reviews/schedule
```

**Access:** 🔵 Internal

**Purpose:** Creates/updates a review queue entry based on decay.

---

### API 5 — Recalculate Review

```http
POST /api/v1/reviews/recalculate
```

**Access:** 🔵 Internal / ⚙️

**Purpose:** Recomputes due dates when mastery/evidence changes.

---

### API 6 — Complete Review

```http
POST /api/v1/reviews/:reviewId/complete
```

**Access:** 🟢 Learner

**Purpose:** Marks a review activity as completed. The resulting evidence should be handled by M4.

#### M10 total: 6 operations

---

## 14. M11 — Progress & Mastery Visualisation

### SRS responsibility M11

M11 presents honest learner state:

- Effective mastery
- Skill graph
- Separate reading/writing scores
- Weak areas without score inflation

### API 1 — Progress Overview

```http
GET /api/v1/progress
```

**Purpose:** Dashboard summary.

---

### API 2 — Mastery Skill Graph

```http
GET /api/v1/progress/skill-graph
```

**Purpose:** Supplies graph nodes plus effective mastery for visualization.

---

### API 3 — Skill Progress

```http
GET /api/v1/progress/skills/:skillId
```

**Purpose:** Detailed progress for one skill.

---

### API 4 — Reading vs Writing

```http
GET /api/v1/progress/reading-writing
```

**Purpose:** Returns separate reading and writing mastery.

---

### API 5 — Progress History

```http
GET /api/v1/progress/history
```

**Purpose:** Historical progress for charts/research.

---

### API 6 — Weak Areas

```http
GET /api/v1/progress/weak-areas
```

**Purpose:** Shows skills where effective mastery is weak.

#### M11 total: 6 operations

---

## 15. M12 — Scaffolding Fade Controller

### SRS responsibility M12

M12 manages scheduled withdrawal of assistance.

Important:

- Schedule is configurable.
- Assistance ceiling is enforced by the server.
- Learner requests cannot override the ceiling.

## API 1 — Scaffolding State

```http
GET /api/v1/scaffolding
```

**Purpose:** Returns current learner scaffolding state.

---

## API 2 — Current Assistance Level

```http
GET /api/v1/scaffolding/current
```

**Purpose:** Returns current permitted assistance/rung state.

---

## API 3 — Get Schedule

```http
GET /api/v1/scaffolding/schedule
```

**Purpose:** Returns the learner plan's withdrawal schedule.

---

## API 4 — Update Schedule

```http
PATCH /api/v1/scaffolding/schedule
```

**Access:** 🟠 Author/Admin

**Purpose:** Configures the withdrawal schedule.

---

## API 5 — Check Permitted Assistance

```http
POST /api/v1/scaffolding/check
```

**Access:** 🔵 Internal

**Purpose:** M8 calls this before delivering assistance.

---

## API 6 — Evaluate Fade

```http
POST /api/v1/scaffolding/evaluate
```

**Access:** 🔵 Internal / ⚙️

**Purpose:** Determines the current scaffolding stage according to the learner plan.

### M12 total: 6 operations

---

## 16. M13 — Calibration & Analytics

### SRS responsibility M13

M13 is primarily administrator-facing and measures:

- Predicted vs observed mastery
- Hint consumption
- Exercise generation success/failure
- Exercise effectiveness
- System calibration

### API 1 — Analytics Overview

```http
GET /api/v1/analytics/overview
```

**Access:** 🟠 Admin

---

### API 2 — Mastery Calibration

```http
GET /api/v1/analytics/mastery-calibration
```

**Purpose:** Compares predicted mastery with held-out challenge outcomes.

---

### API 3 — Hint Consumption

```http
GET /api/v1/analytics/hints
```

**Purpose:** Reports hint-use patterns.

---

### API 4 — Bottoming-Out Analytics

```http
GET /api/v1/analytics/bottoming-out
```

**Purpose:** Measures occasions when learners reach the final hint level.

---

### API 5 — Exercise Effectiveness

```http
GET /api/v1/analytics/exercises
```

**Purpose:** Reports effectiveness by skill/rung.

---

### API 6 — Generation Failures

```http
GET /api/v1/analytics/generation-failures
```

**Purpose:** Reports exercise generation and validation failures.

---

### API 7 — Execution Analytics

```http
GET /api/v1/analytics/execution
```

**Purpose:** Reports sandbox/execution outcomes and operational patterns.

---

### API 8 — Create Calibration Record

```http
POST /api/v1/analytics/calibration
```

**Access:** 🔵 Internal

**Purpose:** Stores predicted-versus-observed calibration data.

#### M13 total: 8 operations

---

## 17. Critical Cross-Module API Flows

The system should not be implemented as 13 isolated CRUD modules.

The modules form a learning loop.

### Flow 1 — New Learner

```text
POST /auth/register
        ↓
POST /auth/login
        ↓
POST /diagnostic/start
        ↓
POST /diagnostic/:id/answers
        ↓
POST /diagnostic/:id/complete
        ↓
M4 /mastery/seed
        ↓
GET /recommendations/next
```

---

## 18. Core Learning Session Flow

```text
Learner
   │
   ▼
M9 Session
   │
   ▼
M5 Recommendation
   │
   ├── reads M4 Mastery
   ├── reads M2 Skill DAG
   └── reads M10 Review Queue
   │
   ▼
M12 Scaffolding Ceiling
   │
   ▼
M6 Exercise
   │
   ▼
Learner submits code
   │
   ▼
M7 Sandbox
   │
   ▼
Structured verdict
   │
   ▼
M4 Evidence Update
   │
   ▼
M10 Review scheduling
   │
   ▼
M11 Progress
   │
   ▼
M5 Next Recommendation
```

---

## 19. Hint Flow

The SRS defines the hint flow as a controlled sequence.

```text
Learner requests hint
        ↓
M8 reads server-side hint state
        ↓
M12 checks scaffolding ceiling
        ↓
Generate exact permitted level
        ↓
Output filter
        ↓
Safe?
  ├── NO → regenerate/fallback
  └── YES
        ↓
Transmit hint
        ↓
Increment hint state
        ↓
Record hint event
        ↓
M4 later uses hints as evidence weighting
        ↓
M13 receives bottom-out telemetry
```

The frontend must not be trusted to choose the hint level.

---

## 20. Recommendation Flow

The LLM does not decide the next skill.

Correct architecture:

```text
Learner
   ↓
M4 Effective Mastery
   ↓
M2 Skill DAG
   ↓
M10 Review Queue
   ↓
M5 Candidate Generation
   ↓
Candidate Scoring
   ↓
Deterministic Selection
   ↓
Writing Mastery
   ↓
Difficulty Rung
   ↓
M6 Exercise Generation
```

Incorrect architecture:

```text
Learner → LLM → "You should learn recursion next"
```

The second approach violates the project's deterministic recommendation constraint.

---

## 21. Exercise Generation Flow

```text
M5 selects skill + rung
        ↓
M6 creates generation job
        ↓
Redis / BullMQ
        ↓
Large-tier LLM
        ↓
Exercise + reference solution + tests
        ↓
M6 verification
        ↓
Managed Sandbox
        ↓
Reference solution passes tests?
       / \
     YES  NO
      │    │
      │    └── discard
      │         ↓
      │     retry/fallback
      │
      ▼
Exercise available
```

Generated exercises must not be served before validation.

---

## 22. Code Submission Flow

```text
POST /submissions
       ↓
Create submission record
       ↓
Create execution job
       ↓
Redis / BullMQ
       ↓
Sandbox Worker
       ↓
Managed Sandbox
       ↓
Network disabled
       ↓
Resource limits
       ↓
Run tests
       ↓
Structured verdict
       ↓
M4 evidence
       ↓
M9 session update
       ↓
M11 progress
```

---

## 23. API Security Rules

### Rule 1 — Never trust mastery from the client

Do NOT allow:

```json
{
  "mastery": 0.95
}
```

from the learner frontend.

The client can submit evidence-producing actions; M4 calculates mastery.

---

### Rule 2 — Never trust hint level from the client

Avoid:

```json
{
  "level": 5
}
```

The server maintains the current permitted hint level.

---

### Rule 3 — Never let the LLM select the next skill

M5 owns recommendation selection.

---

### Rule 4 — Never execute learner code directly in the application server

All learner code must go through the managed sandbox.

---

### Rule 5 — Author/Admin endpoints require RBAC

Examples:

```text
POST /skills
PATCH /skills/:id
POST /exercises/templates
PATCH /exercises/templates/:id
PATCH /scaffolding/schedule
GET /analytics/*
```

These should never be available to a Learner role.

---

## 24. Synchronous vs Asynchronous APIs

The SRS specifies that generation and sandbox execution should be handled asynchronously through the Redis/BullMQ queue rather than blocking interactive request paths.

### Prefer synchronous

```text
Login
Get current user
Get mastery
Get recommendation
Get skill graph
Get progress
Get current session
Request a lightweight hint
```

### Prefer asynchronous

```text
Exercise generation
Exercise self-verification
Sandbox execution
Heavy analytics
Calibration jobs
Large LLM calls
```

---

## 25. Queue Architecture

```text
Frontend
   │
   ▼
Backend API
   │
   ├───────────────┐
   │               │
   ▼               ▼
PostgreSQL       Redis
                    │
                    ▼
                  BullMQ
                 /      \
                ▼        ▼
        Exercise Worker  Sandbox Worker
                │        │
                ▼        ▼
              LLM      Sandbox
                │        │
                └───┬────┘
                    ▼
               PostgreSQL
```

---

# 26. Recommended Backend Structure

```text
backend/
│
├── src/
│   ├── modules/
│   │   ├── auth/             # M1
│   │   ├── skills/           # M2
│   │   ├── diagnostic/       # M3
│   │   ├── mastery/          # M4
│   │   ├── recommender/      # M5
│   │   ├── exercises/        # M6
│   │   ├── execution/        # M7
│   │   ├── socratic/         # M8
│   │   ├── sessions/         # M9
│   │   ├── reviews/          # M10
│   │   ├── progress/         # M11
│   │   ├── scaffolding/      # M12
│   │   └── analytics/        # M13
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── redis/
│   │   ├── queue/
│   │   ├── llm/
│   │   └── sandbox/
│   │
│   ├── shared/
│   │   ├── auth/
│   │   ├── validation/
│   │   ├── errors/
│   │   └── logging/
│   │
│   └── app.ts
│
├── migrations/
├── tests/
└── package.json
```

---

# 27. Recommended Request Lifecycle

For normal API calls:

```text
HTTP Request
     ↓
Authentication
     ↓
Role Authorization
     ↓
Request Validation
     ↓
Controller
     ↓
Application Service
     ↓
Domain Logic
     ↓
Repository
     ↓
Database
     ↓
Response DTO
     ↓
HTTP Response
```

Avoid putting complex learning logic directly inside controllers.

---

# 28. M4 Example Service Architecture

M4 is particularly important and should have explicit domain logic.

```text
M7 Grading Result
       ↓
Evidence Service
       ↓
Mastery Service
       ↓
Validate Evidence
       ↓
Calculate Evidence Weight
       ↓
Update Reading/Writing Score
       ↓
Update Last Evidence Time
       ↓
Calculate Effective Mastery
       ↓
Check Review Threshold
       ↓
M10 Review Queue
```

---

# 29. M5 Example Service Architecture

```text
Request recommendation
       ↓
Load learner goal
       ↓
Load mastery
       ↓
Load skill DAG
       ↓
Load review queue
       ↓
Find prerequisite-ready skills
       ↓
Calculate candidate scores
       ↓
Apply deterministic tie-breaking
       ↓
Select skill
       ↓
Select rung from writing mastery
       ↓
Return recommendation
```

No LLM should be used for candidate selection.

---

# 30. MVP API Surface

Although the complete design contains approximately 98 operations, the team should NOT implement all 98 before proving the core learning loop.

The first vertical slice should contain approximately these **core APIs**:

## Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

## Diagnostic

```http
POST /api/v1/diagnostic/start
POST /api/v1/diagnostic/:id/answers
POST /api/v1/diagnostic/:id/complete
```

## Mastery

```http
GET  /api/v1/mastery
GET  /api/v1/mastery/:skillId
POST /api/v1/mastery/evidence   # internal only, never client-callable (ADR-0006)
```

## Recommendation

```http
GET /api/v1/recommendations/next
```

## Exercise

```http
GET  /api/v1/exercises/:id
POST /api/v1/exercises/generate
```

## Submission

```http
POST /api/v1/submissions
GET  /api/v1/submissions/:id/result
```

## Hints

```http
POST /api/v1/exercises/:id/hints
```

## Session

```http
POST /api/v1/sessions
GET  /api/v1/sessions/active
```

## Progress

```http
GET /api/v1/progress
```

---

# 31. MVP Vertical Slice

The MVP should prove this complete loop:

```text
Register
   ↓
Login
   ↓
Diagnostic
   ↓
Initial Mastery
   ↓
Recommendation
   ↓
Exercise
   ↓
Code Submission
   ↓
Sandbox Grading
   ↓
Evidence
   ↓
Mastery Update
   ↓
Progress
   ↓
Next Recommendation
```

Then add:

```text
Hints
   ↓
Scaffolding Fade
   ↓
Review Queue
   ↓
Analytics
```

---

# 32. Recommended Implementation Order

## Phase 1 — Backend Foundation

```text
M1
Database
Authentication
RBAC
Error handling
Validation
Logging
```

## Phase 2 — Learning Model

```text
M2 Skill DAG
M4 Mastery Model
M3 Diagnostic
```

Recommended dependency order:

```text
M2
 ↓
M4
 ↓
M3
```

---

## Phase 3 — Recommendation

```text
M10 Review Model
M5 Recommender
```

---

## Phase 4 — Exercise System

```text
M6 Exercise Generation
M7 Sandbox Execution
```

---

## Phase 5 — AI Tutor

```text
M8 Socratic Engine
M12 Scaffolding Fade
```

---

## Phase 6 — Session Experience

```text
M9 Session Orchestration
M11 Progress
```

---

## Phase 7 — Research & Evaluation

```text
M13 Calibration & Analytics
```

---

# 33. Dependency Map

```text
M1 ───────────────────────────────┐
                                  │
M2 ───────┐                       │
          ▼                       │
M3 ─────► M4 ─────► M5 ─────► M6 │
          │         ▲             │
          │         │             ▼
          │        M10           M7
          │                       │
          │                       ▼
          └────────────────────── M8
                                    │
M12 ────────────────────────────────┘
 │
 ▼
M9 ─────────► M11
 │
 └──────────► M13

M2 = Skill knowledge
M3 = Initial assessment
M4 = Learner state
M5 = Decision engine
M6 = Exercise generation
M7 = Evidence production
M8 = AI assistance
M9 = Session control
M10 = Review scheduling
M11 = Visualization
M12 = Assistance withdrawal
M13 = Measurement/calibration
```

---

# 34. Traceability: Problem → Module → API

| Problem | Objective | Main Module | Important API |
| --- | --- | --- | --- |
| D1 — completion measured instead of capability | O1 | M4 | `/mastery/evidence` |
| D2 — recognition instead of recall | O1/O5 | M4/M6 | `/mastery/evidence`, `/exercises/generate` |
| D3 — linear curriculum | O2 | M5 | `/recommendations/next` |
| D4 — no persistent learner model | O1/O2 | M4 | `/mastery` |
| D5 — unrestricted AI assistance | O3/O6 | M8/M12 | `/hints`, `/scaffolding/check` |
| D6 — nothing survives disuse | O4 | M4/M10 | `/mastery/:skillId/effective`, `/reviews` |
| D7 — blank page terminates sessions | O5/O6 | M5/M6/M12 | `/recommendations/next`, `/exercises/generate`, `/scaffolding` |

---

# 35. Data Entities Required by the API Layer

The SRS identifies these conceptual entities:

```text
Learner
SkillNode
PrerequisiteEdge
MasteryRecord
Exercise
ExerciseAttempt
HintEvent
Session
ReviewQueueEntry
DiagnosticResult
CalibrationRecord
```

The API implementation should map these to database models/tables while keeping domain relationships explicit.

---

# 36. API Response Standards

All REST APIs should use a consistent response structure.

## Success

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

Recommended HTTP statuses:

```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

---

# 37. Important Engineering Rules

## Rule A — Domain logic belongs in services

Do not calculate mastery inside:

```text
POST /submissions
```

Instead:

```text
SubmissionController
        ↓
SubmissionService
        ↓
SandboxService
        ↓
EvidenceService
        ↓
MasteryService
```

---

## Rule B — Keep M4 protected

M4 should accept evidence only from trusted backend services.

Potential evidence sources:

```text
Diagnostic
Prediction correctness
Exercise success
Sandbox verdict
Other validated learning evidence
```

---

## Rule C — Keep M5 deterministic

Given the same relevant learner state, graph, review queue and configuration, the recommender should produce a reproducible decision.

---

## Rule D — Keep M8 structurally constrained

Do not depend solely on an LLM system prompt saying:

```text
"Never give the answer."
```

The server must control which level is available and filter generated output.

---

## Rule E — Use queues for expensive operations

Use Redis/BullMQ for:

```text
Exercise generation
Exercise verification
Sandbox execution
Heavy analytics/calibration
```

---

# 38. Final Recommended Backend Architecture

```text
                         ┌──────────────────────┐
                         │      FRONTEND        │
                         │  Next.js / React     │
                         └──────────┬───────────┘
                                    │
                              HTTPS / JSON
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     API SERVER       │
                         │ Authentication       │
                         │ RBAC                 │
                         │ Validation           │
                         │ Controllers          │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
          ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
          │ Learning    │    │ Content /   │    │ Session /   │
          │ Engine      │    │ AI Engine   │    │ Analytics   │
          │ M2 M3 M4 M5 │    │ M6 M7 M8    │    │ M9-M13      │
          └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    │
                         ┌──────────▼───────────┐
                         │     PostgreSQL       │
                         │       + pgvector     │
                         └──────────────────────┘
                                    ▲
                                    │
                         ┌──────────┴───────────┐
                         │     Redis + BullMQ    │
                         └───────┬───────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
             ┌──────────────┐          ┌──────────────┐
             │  LLM API     │          │ Managed      │
             │ Small/Large  │          │ Sandbox      │
             └──────────────┘          └──────────────┘
```

---

# 39. Final API Inventory

## M1 — 8

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `PATCH /users/me`
- `POST /auth/change-password`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## M2 — 12

- `GET /skills/graph`
- `GET /skills`
- `GET /skills/:skillId`
- `POST /skills`
- `PATCH /skills/:skillId`
- `DELETE /skills/:skillId`
- `POST /skills/:skillId/prerequisites`
- `DELETE /skills/:skillId/prerequisites/:prerequisiteId`
- `POST /skills/graph/validate`
- `GET /skills/:skillId/prerequisites`
- `GET /skills/:skillId/dependents`
- `GET /skills/graph/history`

## M3 — 6

- `POST /diagnostic/start`
- `GET /diagnostic/:diagnosticId/question`
- `POST /diagnostic/:diagnosticId/answers`
- `GET /diagnostic/:diagnosticId/progress`
- `POST /diagnostic/:diagnosticId/complete`
- `POST /diagnostic/retake`

## M4 — 9

- `GET /mastery`
- `GET /mastery/:skillId`
- `GET /mastery/:skillId/effective`
- `GET /mastery/:skillId/history`
- `POST /mastery/evidence`
- `POST /mastery/update`
- `GET /mastery/:skillId/decay`
- `GET /mastery/weak`
- `POST /mastery/seed`

## M5 — 6

- `GET /recommendations/next`
- `POST /recommendations/generate`
- `GET /recommendations/candidates`
- `GET /recommendations/:recommendationId/explanation`
- `GET /recommendations/history`
- `POST /recommendations/:recommendationId/rung`

## M6 — 9

- `GET /exercises/:exerciseId`
- `POST /exercises/generate`
- `GET /exercises/generation/:jobId`
- `POST /exercises/:exerciseId/validate`
- `POST /exercises/:exerciseId/verify`
- `GET /exercises/templates`
- `POST /exercises/templates`
- `PATCH /exercises/templates/:templateId`
- `POST /exercises/generation-failures`

## M7 — 7

- `POST /submissions`
- `GET /submissions/:submissionId`
- `GET /submissions/:submissionId/result`
- `POST /submissions/:submissionId/execute`
- `POST /submissions/:submissionId/test`
- `GET /submissions/:submissionId/tests`
- `POST /submissions/:submissionId/evidence`

## M8 — 7

- `POST /exercises/:exerciseId/hints`
- `GET /exercises/:exerciseId/hints/state`
- `POST /exercises/:exerciseId/hints/advance`
- `POST /hints/generate`
- `POST /hints/filter`
- `POST /hints/bottom-out`
- `GET /exercises/:exerciseId/hints/history`

## M9 — 8

- `POST /sessions`
- `GET /sessions/active`
- `GET /sessions/:sessionId`
- `POST /sessions/:sessionId/pause`
- `POST /sessions/:sessionId/resume`
- `POST /sessions/:sessionId/end`
- `GET /sessions/:sessionId/current-step`
- `POST /sessions/:sessionId/steps/:stepId/complete`

## M10 — 6

- `GET /reviews`
- `GET /reviews/due`
- `GET /reviews/upcoming`
- `POST /reviews/schedule`
- `POST /reviews/recalculate`
- `POST /reviews/:reviewId/complete`

## M11 — 6

- `GET /progress`
- `GET /progress/skill-graph`
- `GET /progress/skills/:skillId`
- `GET /progress/reading-writing`
- `GET /progress/history`
- `GET /progress/weak-areas`

## M12 — 6

- `GET /scaffolding`
- `GET /scaffolding/current`
- `GET /scaffolding/schedule`
- `PATCH /scaffolding/schedule`
- `POST /scaffolding/check`
- `POST /scaffolding/evaluate`

## M13 — 8

- `GET /analytics/overview`
- `GET /analytics/mastery-calibration`
- `GET /analytics/hints`
- `GET /analytics/bottoming-out`
- `GET /analytics/exercises`
- `GET /analytics/generation-failures`
- `GET /analytics/execution`
- `POST /analytics/calibration`

---

# 40. Final Engineering Decision

The backend should be built around **M4 as the central learning-state engine**, not around the LLM.

The core architecture is:

```text
M2 Skill Knowledge
       +
M4 Learner State
       +
M10 Review State
       ↓
M5 Deterministic Decision
       ↓
M6 Generated/Validated Exercise
       ↓
M7 Executed Evidence
       +
M8 Controlled Assistance
       +
M12 Scheduled Fade
       ↓
M4 Updated Learner State
       ↓
M11 Progress
       +
M13 Calibration
       ↓
Next Learning Cycle
```

The LLM is therefore a **content/interaction component**, while the deterministic backend remains responsible for learner state, recommendation, evidence, scaffolding limits, execution results and auditability.

This separation is fundamental to the AI Tutor project and should be preserved throughout implementation.
