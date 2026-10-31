# Learner Dashboard — Detailed Migration Change Log

> **Scope:** React/Vite Learner Dashboard migrated into the existing Next.js App Router frontend of `Nidanos/ai-tutor-platform`.
>
> **Target:** `apps/web/src`
>
> **Route decision:** the learner home page lives at `app/(dashboard)/page.tsx` and resolves to `/`. The old `/dashboard` route is retired.
>
> **Status:** copy-ready frontend module. The archive was structurally reviewed, but a full typecheck/build against installed dependencies and a live backend was not run in this environment.

---

## 1. Goals and constraints

The migration was designed to:

1. Move the learner dashboard from the standalone React/Vite app into the main Next.js App Router structure.
2. Use the existing `(dashboard)` route group rather than creating or retaining a separate `dashboard` route directory.
3. Reuse the main app's authentication provider and shared API transport.
4. Keep dashboard UI, data fetching, API adapters, and DTOs separated.
5. Keep the implementation independent of a particular subject wherever the backend contract permits.
6. Avoid duplicate auth logic, duplicate API clients, duplicated endpoint paths, fabricated dashboard data, and client-side learning-state calculations.
7. Keep feature code small and readable: the generated `.ts`/`.tsx` files are kept below 100 physical lines, with most deliberately compact files near the requested 50–60-line target.

The dashboard is only one feature module. It does not take ownership of the learning, exercise, progress-detail, diagnostic, review, or account modules.

## 2. High-level change summary

| Area | Before / concern | Change in this module | Reason |
|---|---|---|---|
| Framework | Standalone React/Vite entry point | Next.js App Router page | Aligns with the main web application |
| Route | Standalone dashboard shell / old `/dashboard` destination | `app/(dashboard)/page.tsx` | Uses the requested route group and retires the `/dashboard` URL |
| Authentication | Standalone project auth assumptions | Existing `useAuth()` from `AuthProvider` | One authenticated-user source of truth |
| API transport | Standalone API client | Existing `@/lib/api/client` | Preserves shared cookies, refresh, envelope parsing, and error handling |
| API organization | Feature calls mixed with UI | `lib/dashboard/dashboard.api.ts` | Keeps endpoint details outside presentation components |
| Types | Feature response shapes mixed with component logic | `lib/dashboard/types.ts` and `session.types.ts` | Centralizes contracts and improves reuse |
| Data loading | Dashboard needs several independent resources | `useDashboardData()` | Coordinates requests and exposes loading/error/data state |
| UI | Monolithic page composition | Small dashboard components | Improves readability and future maintenance |
| Subject selection | Standalone selected-course mechanism is not authoritative | Documented course options in one constants file | Avoids browser storage as an authorization source |
| Activity feed | Standalone design may show activity | Not implemented | The inspected frontend API guide does not define an activity-history endpoint |

## 3. Destination file structure

Copy the module's `apps/web/src` tree into the main repository's `apps/web/src` tree.

```text
apps/web/src/
├── app/
│   └── (dashboard)/
│       └── page.tsx
├── components/
│   └── dashboard/
│       ├── DashboardHome.tsx
│       ├── DashboardHeader.tsx
│       ├── CourseSelector.tsx
│       ├── NextStepCard.tsx
│       ├── ProgressCard.tsx
│       ├── SessionCard.tsx
│       ├── Panel.tsx
│       ├── LoadState.tsx
│       └── useDashboardData.ts
└── lib/
    └── dashboard/
        ├── constants.ts
        ├── types.ts
        ├── session.types.ts
        └── dashboard.api.ts
```

### Why this structure?

- `app/` contains route entry points only. The route page handles auth gating and delegates dashboard rendering.
- `components/dashboard/` contains presentation components and the dashboard-specific data hook.
- `lib/dashboard/` contains feature constants, response types, and API adapter functions.
- The module does not add another `lib/api/client.ts`, `AuthProvider`, `Providers`, root layout, or global stylesheet.

## 4. Detailed file-by-file changes

### 4.1 Route page — `app/(dashboard)/page.tsx`

**Responsibility**
- Acts as the learner home route inside the existing route group.
- Reads `user`, `isLoading`, and `logout` from the main app's `useAuth()` hook.
- Displays a session-checking state while authentication is loading.
- Redirects unauthenticated users to `/login` with `router.replace()`.
- Passes the authenticated user and logout callback to `DashboardHome`.

**Why**
- Route-level auth checks should not be reimplemented inside every dashboard card.
- The route remains thin and delegates the actual feature UI to a component.
- Using the existing provider prevents a second, conflicting user/session state.

**Important route behavior**
A Next.js route group name in parentheses is omitted from the URL. Therefore:

- `app/(dashboard)/page.tsx` → `/`
- `app/(dashboard)/learn/...` → `/learn/...`
- `app/(dashboard)/progress/...` → `/progress/...`

It does **not** create `/dashboard`.

### 4.2 `components/dashboard/DashboardHome.tsx`

**Responsibility**
- Composes the dashboard header, course selector, next-step card, progress card, and session card.
- Holds the currently selected course in local component state.
- Calls `useDashboardData(course)` to load server data for that course.
- Starts or resumes a session through `startSession(course)`.
- Navigates to the returned exercise when the session contains a `step.exerciseId`.
- Reloads dashboard data when the session starts but does not yet have an exercise step.
- Displays a user-visible action error if starting a session fails.

**Why**
- This is the composition layer, not the place to implement endpoint details or progress calculations.
- Child components receive only the values and callbacks they need.
- It keeps the subject choice separate from shared presentation components.

### 4.3 `components/dashboard/DashboardHeader.tsx`

**Responsibility**
- Displays the product label, learner greeting, and logout action.
- Receives `displayName` and an `onLogout` callback through props.

**Why**
- Header presentation can be reused by another dashboard page or role-specific shell.
- It does not know how authentication works; the route owns that responsibility.

### 4.4 `components/dashboard/CourseSelector.tsx`

**Responsibility**
- Renders the subject selector from `COURSE_OPTIONS`.
- Emits the selected `CourseSlug` through `onChange`.

**Why**
- Subject options are data-driven rather than repeated in multiple components.
- Future subjects can be added to the course catalog without cloning dashboard components.

**Important limitation**
The inspected main `AuthUser` type does not currently expose an enrolled/selected course property. The selector therefore uses the course slugs documented by the API guide. This is a UI filter, not an authorization mechanism. The backend remains authoritative for access and learning state.

### 4.5 `components/dashboard/NextStepCard.tsx`

**Responsibility**
- Displays the recommendation returned by the recommendation API.
- Shows skill name, rung/level, and whether the reason is a new skill or review.
- Opens the exercise when the response contains an `exerciseId`.
- Shows a preparation message if the recommendation exists but does not yet have an exercise ID.
- Displays prerequisite names from `waitingFor` when there is no recommendation.
- Uses the shared `LoadState` component for loading, error, and retry behavior.

**Why**
- The recommendation engine owns prerequisite rules and next-step selection.
- The frontend renders the result rather than reimplementing recommendation logic.

### 4.6 `components/dashboard/ProgressCard.tsx`

**Responsibility**
- Displays the progress summary returned by the backend.
- Shows total skills, cleared skills, ready skills, and review-due skills.
- Derives a display percentage from `cleared / total` for the visual summary.
- Navigates to `/progress?course={course}` when the learner asks for detailed progress.

**Why**
- The server supplies the progress counts and skill states.
- The small percentage calculation is presentation-only; it does not calculate mastery, change progress, or infer learning status.

### 4.7 `components/dashboard/SessionCard.tsx`

**Responsibility**
- Displays the current M9 session returned by the backend.
- Shows session status, active study duration, and the current step's skill when present.
- Opens the exercise when `session.step.exerciseId` exists.
- Shows a start-studying action when there is no active session.
- Shows a preparation message when a session exists but its next step is not yet available.

**Why**
- The active session is the source of truth for a learner's current study activity.
- A mastery status such as `in_progress` is not treated as an active session.
- Session lifecycle and idle-time handling remain backend responsibilities.

### 4.8 `components/dashboard/Panel.tsx`

**Responsibility**
- Provides a shared card/panel wrapper with a title, optional description, and child content.

**Why**
- Avoids repeating the same panel markup across recommendation, progress, and session cards.
- Gives the dashboard a consistent visual structure.

### 4.9 `components/dashboard/LoadState.tsx`

**Responsibility**
- Renders a loading message, an error with a retry action, or an empty-state message.

**Why**
- Keeps loading/error/empty UI consistent.
- Prevents each data card from implementing its own slightly different retry UI.

### 4.10 `components/dashboard/useDashboardData.ts`

**Responsibility**
- Fetches progress, recommendation, and active session data for the selected course.
- Uses `Promise.allSettled()` so one failed request does not discard successful responses from the other requests.
- Tracks independent error messages for progress, recommendation, and session.
- Exposes a `reload()` function for retrying the dashboard requests.
- Uses a request identifier to ignore stale responses after a course switch or a newer reload.
- Extracts API error messages from the main app's `ApiError` type.

**Why**
- Data orchestration belongs in a hook rather than in visual components.
- Independent request results make the dashboard more resilient to partial API failures.
- The request identifier prevents an older request from overwriting the state for a newer course selection.

### 4.11 `lib/dashboard/dashboard.api.ts`

**Responsibility**
Contains the dashboard's endpoint adapter functions:

- `getDashboardProgress(course)`
- `getDashboardRecommendation(course)`
- `getActiveSession()`
- `startSession(course)`

All functions call the main repository's `api()` helper.

**Why**
- Endpoint paths and request payloads are defined in one place.
- Components do not construct URLs or know about the `/api/v1` prefix.
- Other subject dashboards can reuse these functions when they use the same backend contract.

**Do not add `/api/v1` to these paths.** The shared API client adds the prefix.

### 4.12 `lib/dashboard/types.ts`

**Responsibility**
Defines the dashboard's course, skill, rung, progress, and recommendation response types.

**Why**
- Centralizes the shapes shared by API adapters, hooks, and UI.
- Keeps TypeScript contracts separate from component markup.
- Uses a `CourseSlug` union to prevent unsupported course values from being passed accidentally.

### 4.13 `lib/dashboard/session.types.ts`

**Responsibility**
Defines the M9 `StudySession` response and nested step shape.

**Why**
- Session data is a distinct backend concept and should not be mixed into progress or recommendation types.
- The type can be reused by the future Active Session module, subject to keeping it aligned with the backend contract.

### 4.14 `lib/dashboard/constants.ts`

**Responsibility**
- Defines the currently documented course selector options.
- Defines the default course and language in one location.

**Why**
- Avoids scattering course slugs and language values across components and API calls.
- Makes future catalog changes local and reviewable.

**Current values**
- `cpp-basics` — C++ Basics
- `dsa` — Data Structures & Algorithms
- Default course — `cpp-basics`
- Default language — `cpp`

The default is a temporary UI default because the current authenticated-user contract does not provide enrollment state. Replace it with the platform's authoritative enrollment/selection state when that contract becomes available. Do not use `localStorage` or `sessionStorage` as proof of enrollment or authorization.

## 5. API integration details

### 5.1 Shared transport

The module imports:

```ts
import { api, ApiError } from "@/lib/api/client";
```

It deliberately does not create a new `fetch` wrapper. The main API client is responsible for the common API prefix, credentials/cookies, refresh behavior, response envelope handling, and normalized errors.

### 5.2 Endpoint map

| Dashboard action/data | Method | Feature-relative path | Purpose |
|---|---|---|---|
| Progress summary | GET | `/progress?course={slug}&language=cpp` | Retrieves server-calculated course progress |
| Next recommendation | GET | `/recommendations/next?course={slug}&language=cpp` | Retrieves the next recommended skill/rung/exercise and prerequisite wait list |
| Active session | GET | `/sessions/active` | Retrieves the learner's active/open session, or `null` |
| Start/resume session | POST | `/sessions` | Starts a session or resumes an existing open session |

The shared client adds `/api/v1`, resulting in the API paths documented by the main repo, such as `/api/v1/progress`.

### 5.3 Start-session payload

The adapter sends:

```json
{
  "course": "cpp-basics",
  "language": "cpp"
}
```

The selected course replaces `cpp-basics` at runtime. The API guide documents that `POST /sessions` resumes an open session or starts one and returns `{ session }`.

### 5.4 Data flow

1. The route checks the authenticated user through `useAuth()`.
2. `DashboardHome` selects the active course value.
3. `useDashboardData(course)` requests progress, recommendation, and active session concurrently.
4. Each fulfilled request populates its corresponding state; each rejected request populates its own error state.
5. The cards render the available server data and offer retry when their request fails.
6. Starting study calls `POST /sessions`.
7. If the response includes `session.step.exerciseId`, the app navigates to `/exercise/{exerciseId}`.
8. If there is no step yet, the dashboard reloads the session/progress/recommendation data.

### 5.5 Backend-owned behavior

The frontend must not reimplement:

- Skill mastery or progression rules.
- Prerequisite evaluation.
- Recommendation ranking or selection.
- Session state transitions or idle-time policy.
- Exercise grading or hidden-test evaluation.

The dashboard displays backend results. Exercise solving and session advancement belong to their respective modules and backend contracts.

## 6. Route and integration changes required in the main repository

The module's route is `(dashboard)/page.tsx`, which resolves to `/`. The main repository ZIP inspected for this migration already contains a root `app/page.tsx` placeholder and an older `app/dashboard/page.tsx` page. Both conflict with the requested route consolidation.

Apply the following integration edits when installing the module:

1. Delete `apps/web/src/app/page.tsx` — the old root placeholder, because the new `(dashboard)/page.tsx` will own `/`.
2. Delete `apps/web/src/app/dashboard/page.tsx` — the old `/dashboard` route, which is being retired.
3. In `apps/web/src/app/(auth)/forms/LoginForm.tsx`, change the successful-login redirect from `/dashboard` to `/`.
4. In `apps/web/src/components/diagnostic/DiagnosticContainer.tsx`, change the completed-diagnostic redirect from `/dashboard` to `/`.
5. Search `apps/web/src` for other references to `/dashboard`. Change only references that mean the learner home page; do not rename the `(dashboard)` directory or change unrelated routes.
6. Keep the existing `(dashboard)/diagnostic`, `learn`, `progress`, and `reviews` route placeholders. They are separate routes inside the same route group.
7. Keep the root layout, providers, AuthProvider, and shared API client unchanged.

**Do not delete the `(dashboard)` route group.** Only the old plain `dashboard` route folder is removed.

## 7. Adding another subject later

The architecture is intended to avoid a separate dashboard implementation for every subject.

When a new subject is supported by the backend:

1. Confirm the canonical course slug and supported language with the backend/API contract.
2. Add the new option to `COURSE_OPTIONS` in `lib/dashboard/constants.ts`.
3. Extend the `CourseSlug` union in `lib/dashboard/types.ts` with the exact supported slug.
4. Confirm the progress and recommendation endpoints support that subject.
5. Confirm whether the subject uses the same session contract and language field.
6. If the subject uses a different learning/session contract, add a narrowly scoped adapter/type rather than branching all shared UI components.
7. Replace `DEFAULT_COURSE` with the authenticated enrollment/selection source when the platform exposes one.

Do **not** copy `DashboardHome`, `ProgressCard`, `NextStepCard`, or API wrappers for each subject. The current cards consume common response contracts and receive the selected course as data.

## 8. DRY, modularity, and code-size decisions

- Shared panel markup is in `Panel.tsx`.
- Shared loading/error/empty rendering is in `LoadState.tsx`.
- Course options and default language are centralized in `constants.ts`.
- API endpoint paths and request payloads are centralized in `dashboard.api.ts`.
- API DTOs are centralized in the `lib/dashboard` type files.
- Data orchestration is centralized in `useDashboardData.ts`.
- UI components communicate through typed props and callbacks instead of importing auth or making their own API calls.
- No subject-specific copies of the dashboard components are created.
- The generated `.ts` and `.tsx` source files stay below 100 physical lines. A few components are compactly formatted to respect this limit; readability and the requested line ceiling should both be preserved during future edits.

When a future change pushes a file beyond the agreed limit, extract a cohesive helper/component/type. Do not split code into arbitrary fragments just to reduce line count.

## 9. Deliberately excluded from this migration

| Excluded item | Reason |
|---|---|
| Standalone Vite `App.tsx`, `main.tsx`, and Vite configuration | Next.js owns app bootstrapping and routing |
| Standalone AppShell, Sidebar, and TopBar | The main app's shared shell conventions must remain authoritative; this module does not invent a second shell |
| Standalone auth service/provider | Main `AuthProvider` already owns authentication state |
| Standalone API client | Main `api()` transport already owns API communication |
| Recent activity feed | The inspected frontend API guide does not define an activity-history endpoint; no fake activity is rendered |
| Learning/lesson pages | Separate Learn module migration |
| Exercise/active-session workspace | Separate Exercise/Active Session migration |
| Detailed progress map | Separate Progress module migration |
| Account/profile screens | Separate Account module migration |
| Diagnostic flow | Existing diagnostic route and behavior are retained |
| Backend endpoints | Existing documented endpoints are reused; no new backend route is introduced by this frontend module |

## 10. Installation procedure

1. Create or switch to a feature branch in the main repository. Do not integrate this feature directly on `main`.
2. Extract the module ZIP.
3. Copy the ZIP's `apps/web/src/components/dashboard/` into the main repo's same path.
4. Copy the ZIP's `apps/web/src/lib/dashboard/` into the main repo's same path.
5. Copy `apps/web/src/app/(dashboard)/page.tsx` into the existing `(dashboard)` route group.
6. Apply the route cleanup and redirect edits listed in Section 6 and `INSTALL_PATCHES.md`.
7. Review the diff. Confirm no existing auth, API client, diagnostic, or root-layout code was overwritten.
8. Install dependencies using the repository's package manager if needed.
9. Run typecheck and build from the repository root.
10. Test the dashboard against a running API and authenticated test account.

### Suggested commands

```bash
pnpm --filter @ai-tutor/web typecheck
pnpm --filter @ai-tutor/web build
```

If the package name or scripts have changed since the supplied repository ZIP, use the current `apps/web/package.json` scripts rather than assuming these command names remain unchanged.

## 11. Verification checklist

### Static checks

- [ ] No TypeScript import points to the standalone Vite app.
- [ ] No duplicate API client or auth provider was added.
- [ ] All dashboard API paths are relative to the shared `api()` client.
- [ ] No `/dashboard` redirect remains for the learner home route.
- [ ] No route conflict remains between `app/page.tsx` and `(dashboard)/page.tsx`.
- [ ] The old `app/dashboard/page.tsx` route is removed.
- [ ] The `(dashboard)` group and its diagnostic/learn/progress/reviews children remain.
- [ ] All feature `.ts`/`.tsx` files remain below 100 lines.
- [ ] Typecheck passes.
- [ ] Production build passes.

### Runtime checks

- [ ] A signed-out visitor is redirected to `/login`.
- [ ] An authenticated learner can load `/`.
- [ ] Progress renders from the selected course's API response.
- [ ] Recommendation renders from the API response.
- [ ] A recommendation with an exercise ID opens `/exercise/{id}`.
- [ ] A recommendation without an exercise ID displays the preparation state.
- [ ] Prerequisites are displayed when `waitingFor` is populated.
- [ ] An active/paused session renders the backend session state.
- [ ] A session with a step opens its exercise.
- [ ] Starting a session calls `POST /sessions` and navigates when a step is returned.
- [ ] Independent API failures show their own error and retry action.
- [ ] Switching courses reloads course-dependent progress and recommendation data.
- [ ] Logout uses the existing provider and returns to `/login`.

## 12. Known limitations and follow-up work

1. **Course enrollment source:** current `AuthUser` does not expose the learner's enrolled course. The selector currently uses the two API-guide course slugs and a documented default. Replace this with authoritative platform state once the backend/auth contract exposes it.
2. **Course/language model:** this dashboard currently sends `language: "cpp"` for both documented course options because that is the contract represented in the inspected frontend guide. Confirm this remains correct before adding a non-C++ subject. If another subject uses another language, model the course-to-language mapping in the catalog rather than hardcoding language in the API adapter.
3. **No activity feed:** no activity-history endpoint was identified in the inspected guide, so the dashboard does not fabricate recent activity.
4. **No shared shell added:** the module is focused on the dashboard home content. Any common sidebar/top navigation should be integrated through the main app's chosen shared layout rather than copied from the standalone app.
5. **Build/runtime verification:** the generated module was checked structurally, but typecheck, production build, and live API flows must be run after installation in the actual repository environment.

## 13. Source-of-truth references

The migration was aligned to the uploaded main repository ZIP and its frontend API contract, especially:

- `apps/web/src/components/auth/AuthProvider.tsx` — authenticated user and logout contract.
- `apps/web/src/lib/api/client.ts` — shared API transport and `ApiError` contract.
- `apps/web/src/app/layout.tsx` — existing root layout/provider boundary.
- `apps/web/src/app/(dashboard)/` — existing route-group location.
- `DOCS/api/FRONTEND-GUIDE.md` — documented progress, recommendation, and session endpoint contracts.

If the main repository changes after the supplied ZIP was created, re-check these files and the API guide before copying the module. The live repository may have evolved since the archive was supplied.

---

**Migration boundary:** this document describes the Learner Dashboard Home module only. It is not a claim that the remaining learner modules have been migrated or that the backend has been modified.
