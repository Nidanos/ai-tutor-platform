# AI Tutor Diagnostic Module --- Main Project Change Log

**Project:** `ai-tutor-platform`\
**Feature:** Adaptive DSA Diagnostic Assessment\
**Target application:** Next.js 16 App Router (`apps/web`)\
**Primary local feature commit:** `d2bf131`\
**Merge commit:** `68ded2c`\
**Documentation date:** 31 October 2026

------------------------------------------------------------------------

## 1. Purpose of this document

This document records the diagnostic assessment changes integrated into
the main AI Tutor platform. It explains:

-   What was added or adapted.
-   Where each part belongs in the main repository.
-   Why the change was needed.
-   How the frontend communicates with the existing diagnostic backend.
-   How the learner moves through the assessment.
-   What still needs local integration and end-to-end verification.

The diagnostic feature was prepared as a Next.js-compatible module
rather than embedding the standalone Vite application inside the
platform.

> **Scope note:** This report describes the diagnostic feature
> implementation and the merge process shown in the supplied project
> history. It does not claim that the backend, database, queue, or
> sandbox were changed as part of the frontend migration.

------------------------------------------------------------------------

## 2. Source and target architecture

### 2.1 Standalone diagnostic application

The original diagnostic project was a standalone React + TypeScript
application built with Vite. Its application entry point was an
`App.tsx` component mounted through Vite's `main.tsx`.

The standalone project included the diagnostic introduction, question
flow, C++ coding workspace, Monaco editor, completion screen, and
frontend API service.

### 2.2 Main AI Tutor platform

The target repository is a monorepo. The relevant frontend application
is:

``` text
apps/
└── web/
    └── src/
        ├── app/
        ├── components/
        ├── lib/
        └── types/
```

The target frontend uses Next.js App Router. The main application
already provides shared infrastructure, including:

-   Next.js routing and layouts.
-   An authentication provider.
-   A shared API client.
-   Tailwind styling and global application CSS.
-   Monaco Editor and Lucide dependencies.

The diagnostic module was adapted to use those existing platform
services instead of creating a second app runtime or a parallel
authentication/API layer.

------------------------------------------------------------------------

## 3. New module structure

The copy-ready module is organized as follows:

``` text
apps/web/
└── src/
    ├── app/
    │   └── (dashboard)/
    │       └── diagnostic/
    │           └── page.tsx
    │
    ├── components/
    │   └── diagnostic/
    │       ├── DiagnosticContainer.tsx
    │       ├── DiagnosticHeader.tsx
    │       ├── DiagnosticIntro.tsx
    │       ├── DiagnosticComplete.tsx
    │       ├── ProgressStepper.tsx
    │       ├── QuestionCard.tsx
    │       └── coding/
    │           ├── CodeEditor.tsx
    │           ├── CodingWorkspace.tsx
    │           ├── EditorToolbar.tsx
    │           ├── ProblemDescription.tsx
    │           └── TestCasePanel.tsx
    │
    ├── lib/
    │   └── diagnostic/
    │       └── diagnostic.api.ts
    │
    └── types/
        └── diagnostic.ts

apps/web/public/
└── images/
    └── robot-mascot.svg
```

The module archive also contains:

-   `README-INTEGRATION.md` --- practical copy and setup instructions.
-   `DIAGNOSTIC-IMPLEMENTATION-REPORT.md` --- the original
    implementation and migration report.

------------------------------------------------------------------------

## 4. Detailed file-by-file changes

### 4.1 `apps/web/src/app/(dashboard)/diagnostic/page.tsx`

**Role:** Next.js route entry point.

**Change:** The Vite application entry point was replaced by a Next.js
App Router page that renders the diagnostic container.

**Why it was needed:** Next.js does not use the standalone Vite
`main.tsx` as a route entry point. A page file is required for App
Router navigation.

**Usage:** The route is available at:

``` text
/diagnostic
```

The `(dashboard)` folder is a route group. Its name is not part of the
URL.

### 4.2 `apps/web/src/components/diagnostic/DiagnosticContainer.tsx`

**Role:** Main diagnostic flow controller.

**Change:** The standalone `App.tsx` orchestration was moved into a
client-side Next.js component.

**Responsibilities:**

-   Manage intro, assessment, and completion screens.
-   Start or resume a diagnostic attempt.
-   Store the current diagnostic state returned by the backend.
-   Keep the learner's current reading answer or C++ code in component
    state.
-   Submit answers.
-   Skip a task using the backend's `dontKnow` request.
-   Display loading and API error states.
-   Allow the learner to finish the assessment.
-   Wait while asynchronous grading is pending.
-   Pass backend-generated results to the completion screen.

**Why it was needed:** React state and browser interactions belong in a
Client Component. The container also gives the feature one place to
coordinate the backend-driven state machine.

### 4.3 `apps/web/src/components/diagnostic/DiagnosticHeader.tsx`

**Role:** Diagnostic page header.

**Change:** The standalone hard-coded learner identity was adapted to
use the signed-in user's information from the main application's
authentication context.

**Why it was needed:** The diagnostic page should show the actual
authenticated learner, not a placeholder profile.

**Usage:** The header is part of the diagnostic screen and receives
learner display information from the existing auth provider.

### 4.4 `apps/web/src/components/diagnostic/DiagnosticIntro.tsx`

**Role:** Introduction and assessment start screen.

**Change:** The intro screen was retained as a reusable component and
connected to the container's start handler and loading state.

**Why it was needed:** Starting a diagnostic is an asynchronous backend
operation. The start action needs to reflect the pending state and avoid
repeated clicks.

**Usage:** The learner reviews the diagnostic introduction and starts or
resumes the assessment.

### 4.5 `apps/web/src/components/diagnostic/ProgressStepper.tsx`

**Role:** Visual assessment-stage indicator.

**Change:** The existing stepper UI was retained as a presentational
component.

**Why it was needed:** It gives the learner a visual indication of the
current stage without calculating diagnostic mastery or inventing
question counts on the frontend.

### 4.6 `apps/web/src/components/diagnostic/QuestionCard.tsx`

**Role:** Renders the current backend-provided question.

**Change:** The question card was adapted to work with the typed backend
question contract and support both diagnostic dimensions:

-   **Reading:** Learner submits a predicted output / text answer.
-   **Writing:** Learner writes C++ code in the coding workspace.

The skip action is connected to the backend `dontKnow` contract.
Unsupported previous-question navigation was removed from the integrated
flow.

**Why it was needed:** The backend controls adaptive question selection.
The frontend should render the current task rather than keep its own
static question sequence.

**Usage:** The container supplies the current question, answer/code
state, and submit/skip callbacks.

### 4.7 `apps/web/src/components/diagnostic/DiagnosticComplete.tsx`

**Role:** Assessment completion and result presentation.

**Change:** The completion component was adapted to accept the completed
diagnostic response and render the backend's skill-wise result data.

The result presentation includes:

-   Skill name.
-   Reading estimate.
-   Writing estimate.
-   Confidence value.

**Why it was needed:** The frontend must not calculate or fabricate
mastery scores. The backend is the source of truth for diagnostic
grading and estimates.

**Usage:** The container renders this component only after the
completion API returns a completed result.

### 4.8 `apps/web/src/components/diagnostic/coding/CodeEditor.tsx`

**Role:** C++ code editor.

**Change:** The Monaco editor is configured for the diagnostic's C++
writing tasks.

**Why it was needed:** The diagnostic's writing dimension evaluates C++
solutions. A browser-side JavaScript execution path is not part of this
workflow.

### 4.9 `apps/web/src/components/diagnostic/coding/CodingWorkspace.tsx`

**Role:** Combines the coding problem, editor, toolbar, and sample
panel.

**Change:** The coding workspace was connected to the current diagnostic
question and the container's code state.

**Why it was needed:** It separates the writing-task layout from the
assessment orchestration and keeps editor state controlled by the parent
flow.

### 4.10 `apps/web/src/components/diagnostic/coding/EditorToolbar.tsx`

**Role:** Editor action controls.

**Change:** The local Run Code action was removed from the diagnostic
toolbar. The writing answer is submitted through the diagnostic answer
API.

**Why it was needed:** The diagnostic backend owns code execution and
grading. A local run action would imply a separate execution path and
could produce results inconsistent with the backend.

### 4.11 `apps/web/src/components/diagnostic/coding/ProblemDescription.tsx`

**Role:** Displays the writing problem.

**Change:** The component uses the backend question's skill, prompt,
function signature, and sample information.

**Why it was needed:** Problem content should come from the active
backend question, not a hard-coded local question bank.

### 4.12 `apps/web/src/components/diagnostic/coding/TestCasePanel.tsx`

**Role:** Displays learner-visible sample information.

**Change:** The panel presents sample input and expected output as
reference information. It does not run a local judge or expose hidden
tests.

**Why it was needed:** Sample information is part of the learner-facing
prompt. Actual evaluation remains on the backend.

### 4.13 `apps/web/src/lib/diagnostic/diagnostic.api.ts`

**Role:** Diagnostic-specific API functions.

**Change:** The standalone raw-fetch service was adapted to call the
main application's shared API client.

**Operations exposed to the container:**

-   Start or resume a diagnostic.
-   Submit a reading answer or C++ code.
-   Submit a `dontKnow` response.
-   Request diagnostic completion.
-   Wait and retry when completion is still in the grading state.

**Why it was needed:** The main API client already handles the
platform's API base path, standard response envelope, credentials, and
shared session behaviour. Reusing it avoids duplicate request
infrastructure and avoids accidentally adding the API version prefix
twice.

**Important:** The diagnostic service should pass endpoint paths
relative to the shared client's configured API prefix. Do not manually
prepend `/api/v1` if the shared client adds it.

### 4.14 `apps/web/src/types/diagnostic.ts`

**Role:** TypeScript contracts for diagnostic requests and responses.

**Change:** Diagnostic-specific types were isolated in one module file.

The types cover:

-   Reading and writing dimensions.
-   Skill metadata.
-   Sample input and expected output.
-   Current diagnostic question.
-   In-progress attempt.
-   Completed diagnostic.
-   Skill-wise results.
-   Grading-pending state.
-   Start request.
-   Answer / skip request.

**Important type detail:** The in-progress question supports both an
omitted value and `null`:

``` ts
question?: DiagnosticQuestion | null;
```

**Why it was needed:** The backend can return `question: null` when the
adaptive sequence has no next question. The type should represent the
actual backend response instead of assuming that a question always
exists.

**Why not immediately add these to `packages/types`:** Keeping the first
integration scoped to the feature avoids changing the shared type
package before the team decides whether these contracts should become
cross-package types.

### 4.15 `apps/web/public/images/robot-mascot.svg`

**Role:** Diagnostic intro illustration.

**Change:** The mascot asset was placed in the Next.js public asset
directory.

**Why it was needed:** Next.js serves static public assets from the
app's public directory. The asset should not depend on Vite's
public-file handling.

------------------------------------------------------------------------

## 5. Backend API integration

The frontend integrates with the existing diagnostic API. The backend
was not rewritten as part of this frontend migration.

  ----------------------------------------------------------------------------------------
  Operation               Method and endpoint                      Frontend purpose
  ----------------------- ---------------------------------------- -----------------------
  Start / resume          `POST /api/v1/diagnostic/start`          Create or resume an
                                                                   attempt

  Submit answer           `POST /api/v1/diagnostic/:id/answers`    Submit reading output
                                                                   or C++ code

  Skip                    `POST /api/v1/diagnostic/:id/answers`    Submit `dontKnow: true`
                                                                   for the current item

  Complete                `POST /api/v1/diagnostic/:id/complete`   Finalize the attempt or
                                                                   check grading status
  ----------------------------------------------------------------------------------------

### 5.1 Start request

The DSA assessment starts with a request equivalent to:

``` json
{
  "course": "dsa",
  "language": "cpp",
  "retake": false
}
```

The backend may return an active attempt to resume or a completed result
if a previous result is available and retake is false.

### 5.2 Answer request

For a reading answer or a C++ code submission:

``` json
{
  "itemId": "current-question-item-id",
  "answer": "learner answer or C++ source code"
}
```

For a skipped question:

``` json
{
  "itemId": "current-question-item-id",
  "dontKnow": true
}
```

The backend returns the next adaptive state. The frontend should not
increment a local question index or assume a fixed number of questions.

### 5.3 Completion and asynchronous grading

The completion endpoint can return:

-   A completed diagnostic result.
-   A grading-pending response, including a retry delay.

The frontend waits for the indicated delay and requests completion
again. This is needed because C++ writing submissions can be evaluated
asynchronously by the existing execution infrastructure.

### 5.4 Result values

The completed response includes a list of skill results. Each result
contains a skill identity and backend-provided reading, writing, and
confidence estimates.

The UI should display these values as returned or apply a clearly
documented presentation conversion. It must not calculate its own
diagnostic score.

------------------------------------------------------------------------

## 6. Learner journey after integration

The intended frontend flow is:

1.  Learner opens `/diagnostic`.
2.  The page checks the existing authentication state.
3.  An unauthenticated learner is redirected to the platform login
    route.
4.  The learner starts the DSA diagnostic.
5.  The frontend sends the start request.
6.  The backend returns the current question or an existing completed
    result.
7.  The learner answers a reading question or writes C++ code.
8.  The frontend submits the current item to the answer endpoint.
9.  The backend grades / records the answer and chooses the next
    adaptive question.
10. The frontend renders the returned question.
11. The learner may skip a task using the `dontKnow` option.
12. When the learner finishes, the frontend calls the completion
    endpoint.
13. If grading is pending, the frontend waits and retries.
14. When completion is returned, the frontend displays the skill-wise
    result summary.

The backend remains authoritative for question selection, grading, and
diagnostic estimates.

------------------------------------------------------------------------

## 7. Important design decisions and reasons

  -----------------------------------------------------------------------
  Decision                            Reason
  ----------------------------------- -----------------------------------
  Use Next.js App Router              The feature belongs inside the
                                      existing Next.js application.

  Use a Client Component for the      The assessment uses React state and
  interactive flow                    browser interactions.

  Reuse the existing auth provider    Avoid a separate identity/session
                                      implementation.

  Reuse the existing API client       Preserve shared request,
                                      credential, and error handling.

  Keep backend-driven adaptive        The server decides which question
  progression                         comes next.

  Submit C++ code through diagnostic  The diagnostic backend routes
  answers                             writing tasks to the existing
                                      execution/grading flow.

  Remove local JavaScript execution   It is not the diagnostic's C++
                                      evaluation path.

  Remove unsupported Previous         No previous-question API is exposed
  navigation                          by the diagnostic contract.

  Support skip for both dimensions    The backend accepts a `dontKnow`
                                      answer.

  Handle HTTP 202 grading state       Code evaluation may still be
                                      pending when completion is first
                                      requested.

  Display backend result estimates    Avoid frontend-generated or
                                      fabricated diagnostic scores.

  Keep feature-specific types local   Limit changes to shared packages
  initially                           during the first integration.

  Keep Vite bootstrap and global CSS  Avoid a duplicate app root and
  out of Next.js                      global style collisions.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 8. What was deliberately not changed

The diagnostic frontend integration did not require a rewrite of the
following existing platform systems:

-   Diagnostic backend controller and service.
-   Diagnostic database schema and migrations.
-   Diagnostic seed data.
-   Existing code execution / sandbox infrastructure.
-   Existing authentication implementation.
-   Existing shared API client.
-   Existing global Next.js layout and Tailwind setup.
-   Shared `packages/types` package.

The diagnostic feature consumes these existing systems through their
established contracts.

------------------------------------------------------------------------

## 9. Git history and merge record

The local Git history shown during the synchronization process
contained:

### Feature commit

``` text
d2bf131 feat(diagnostic): integrate adaptive DSA diagnostic assessment into Next.js platform
```

This is the diagnostic feature commit on local `main`.

### Merge commit

``` text
68ded2c merge: integrate remote main while preserving diagnostic module
```

During synchronization, the local and remote `main` branches had
diverged. Git reported a modify/delete conflict for:

``` text
apps/web/src/app/(dashboard)/diagnostic/page.tsx
```

The remote branch had deleted the route file, while the local feature
branch had modified it. The local route version was staged to preserve
the diagnostic page, and the merge was completed.

The merge also brought in remote changes to documentation, deployment
instructions, report generation files, and workspace/lock files. Those
remote changes are part of the merge commit, not new diagnostic feature
files.

At the time of the last reported status, Git showed the local branch
ahead of `origin/main` by two commits and the working tree clean. A
successful `git push` was not confirmed in the conversation. Verify the
remote status before treating the commits as published.

------------------------------------------------------------------------

## 10. Local verification checklist

Run these commands from the repository root:

``` bash
pnpm --filter @ai-tutor/web typecheck
pnpm --filter @ai-tutor/web build
```

Then start the web app and backend using the repository's normal
development commands.

Verify the following manually:

-   [ ] `/diagnostic` route loads.
-   [ ] Unauthenticated access redirects to login.
-   [ ] Authenticated access displays the diagnostic introduction.
-   [ ] Start request reaches the backend.
-   [ ] An existing in-progress attempt resumes correctly.
-   [ ] Reading answers submit successfully.
-   [ ] C++ code submissions reach the diagnostic answer endpoint.
-   [ ] Skip works for reading and writing questions.
-   [ ] The next question comes from the backend response.
-   [ ] Empty answers are blocked appropriately.
-   [ ] Duplicate submission is prevented while a request is pending.
-   [ ] Finish-now works when supported by the current backend state.
-   [ ] HTTP 202 grading responses are handled.
-   [ ] Completion polling stops when a completed result is returned.
-   [ ] Skill-wise results display the values returned by the backend.
-   [ ] Browser console and server logs show no unexpected errors.

A successful TypeScript check or production build does not prove that
the database, diagnostic seed data, queue, or C++ sandbox is
operational. Those require an end-to-end test against the running
backend environment.

------------------------------------------------------------------------

## 11. Known boundaries and follow-up considerations

1.  **Backend availability:** The frontend depends on the diagnostic API
    being reachable in the current environment.
2.  **Seed data:** A valid diagnostic question bank must exist for the
    requested course and language.
3.  **C++ execution:** Writing assessment requires the backend's queue
    and execution infrastructure to be available.
4.  **Authentication:** The route must be tested with the platform's
    real session and cookie configuration.
5.  **Retake behaviour:** The current start flow sends `retake: false`.
    A dedicated retake UX is a separate product decision.
6.  **Previous-question navigation:** It remains unsupported unless a
    corresponding backend capability is added.
7.  **Result scale:** Keep the UI's display conversion consistent with
    the actual backend estimator contract. Do not assume a scale without
    confirming the service implementation.

------------------------------------------------------------------------

## 12. Summary

The diagnostic assessment has been structured as a Next.js feature
within the main AI Tutor platform. The integration replaces the
standalone Vite entry point with a Next.js route, moves assessment
orchestration into a client component, reuses the platform's
authentication and API infrastructure, defines diagnostic-specific
TypeScript contracts, and displays backend-driven assessment results.

The design keeps question selection and grading on the backend, while
the frontend focuses on presenting questions, collecting reading answers
and C++ code, managing request states, and rendering the final
diagnostic summary.

The remaining work is local typecheck/build verification and end-to-end
testing with the running backend, database, and code-execution services.
