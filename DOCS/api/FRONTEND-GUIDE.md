# Frontend API Guide

For Aman and Aditi. How the web app talks to the backend. Last updated 13 Oct 2026.

**Status:** the 5 auth endpoints are live. Everything in section 7 is planned: build those screens with mock data until each endpoint is marked live.

## 1. Run the backend locally (once)

```bash
pnpm install          # repo root
pnpm db:up            # Postgres + Redis in Docker
```

In `apps/api`: copy `.env.example` to `.env` and ask Ashwani for the values, then:

```bash
pnpm db:migrate       # create the tables
pnpm db:seed          # load languages, courses, fade schedule
pnpm dev              # API on http://localhost:3001
```

## 2. Add the proxy to the web app (once)

The browser must talk to **one origin** (`localhost:3000`). Next.js forwards `/api/*` to the API. This makes cookies work and avoids CORS completely. In `apps/web/next.config.mjs` add:

```js
async rewrites() {
  return [{ source: "/api/:path*", destination: `${process.env.API_URL ?? "http://localhost:3001"}/api/:path*` }];
},
```

## 3. Rules for every call

- Call **relative** URLs: `fetch("/api/v1/...")`. Never `http://localhost:3001` (cookies and the CSRF check would fail).
- Send JSON with `Content-Type: application/json`.
- **Never store tokens in JavaScript** (no localStorage). The browser keeps them in httpOnly cookies and sends them automatically.
- Every response has one shape:
  - Success: `{ "success": true, "data": { ... } }`. A `204` has no body.
  - Error: `{ "success": false, "error": { "code": "EMAIL_TAKEN", "message": "...", "details": [...] } }`
- Branch your logic on `error.code`; show `error.message` to the user.
- For `VALIDATION_ERROR`, `details` is a list of `{ path: ["email"], message: "..." }`: show each message next to its field.
- Never compute learning state in the UI (mastery, hint level, fade). Always show what the server returns.

## 4. Auth endpoints (live)

Base path: `/api/v1/auth`

| Method + path | Body | Success | Errors |
| --- | --- | --- | --- |
| `POST /register` | `{ email, password, displayName, dateOfBirth, acceptTerms, acceptPrivacy, aiTraining?, research? }` | `201 { user }` (no login) | `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`, `429 RATE_LIMITED` |
| `POST /login` | `{ email, password }` | `204` + cookies set | `401 INVALID_CREDENTIALS`, `403 PARENT_APPROVAL_PENDING`, `429 RATE_LIMITED` |
| `POST /refresh` | none (uses the cookie) | `204` + new cookies | `401 UNAUTHENTICATED` → go to login |
| `POST /logout` | none | `204`, cookies cleared | none |
| `GET /me` | none | `200 { user }` | `401` → try refresh once (section 6) |

Form rules (same as the server, so show errors before submitting):

| Field | Rule |
| --- | --- |
| email | valid email, ≤ 254 characters (case doesn't matter) |
| password | 8 to 128 characters, any characters, no "must contain a symbol" rule |
| displayName | 1 to 80 characters after trimming spaces |
| dateOfBirth | `"YYYY-MM-DD"`, not in the future (use a date picker) |
| acceptTerms, acceptPrivacy | must be `true`: two **separate** required tick boxes, each linking to its page (`/terms`, `/privacy`) |
| aiTraining, research | optional, **unticked by default**. **Show them only if the date of birth makes the user 18+**; the server rejects them for under-18s |

`user` object:

```ts
type User = {
  id: string;
  email: string;
  displayName: string;
  role: "LEARNER" | "AUTHOR" | "ADMIN";
  timezone: string;   // e.g. "Asia/Kolkata"
  dateOfBirth: string | null; // "YYYY-MM-DD"
  status: "active" | "pending_parent"; // pending_parent = under 18, waiting for a parent
  createdAt: string;  // ISO date
};
```

## 4b. Submissions (live, 15 Oct)

Base path: `/api/v1/submissions`. Logged in only. Max **10 submits per minute** per learner.

| Method + path | Body | Success | Errors |
| --- | --- | --- | --- |
| `POST /` | `{ attemptId, answer, idempotencyKey }` | `202 { submissionId, status: "queued" }` | `400 VALIDATION_ERROR`, `404 ATTEMPT_NOT_FOUND`, `409 ATTEMPT_CLOSED`, `409 IDEMPOTENCY_KEY_REUSED`, `429 RATE_LIMITED` |
| `GET /:id/result` | none | `200`: while running `{ submissionId, status: "queued" | "running" }`; when done, the full result below | `404 SUBMISSION_NOT_FOUND` |

- **`answer`**: the code from the editor (max 64 KB). For rung 1 ("predict the output") it's the predicted text.
- **`idempotencyKey`**: make one per press of Submit with `crypto.randomUUID()`. If the request is retried with the same key, you get the same submission back, so it never runs twice.
- **`attemptId`**: comes from `GET /exercises/:id` (section 4c).
- **Polling**: call `GET /:id/result` every **1 second** until `status === "completed"`. A run usually takes **4–7 seconds**. Show a "Running tests…" spinner.

Finished result:
```ts
type SubmissionResult = {
  submissionId: string;
  status: "completed";
  verdict: "AC" | "WA" | "CE" | "RE" | "TLE" | "MLE" | "SE";
  testsPassed: number;
  testsTotal: number;
  compileOutput?: string; // only for CE: show it in a monospace box
  tests: Array<{
    seq: number; name: string; visibility: "sample" | "hidden";
    verdict: string; timeMs: number;
    input?: string; expectedOutput?: string; output?: string; // sample tests only
  }>; // only tests that ran: after a crash or time-out the rest are skipped
};
```

| Verdict | Show the learner |
| --- | --- |
| AC | "All tests passed" 🎉 |
| WA | "Wrong answer on test N": for a sample test show input, expected and their output side by side; for a hidden test only its name |
| CE | "Doesn't compile" + `compileOutput` |
| RE | "Your program crashed on test N" (e.g. divide by zero, bad memory access) |
| TLE | "Too slow on test N": limit 2 s per test |
| MLE | "Used too much memory on test N": limit 256 MB |
| SE | "Our checker had a problem, not your code. Please submit again." It doesn't count against the learner |

**Never show hidden tests' input or output.** The API doesn't send them, so don't try to fill them in.

## 4c. Exercises and mastery (live, 16 Oct)

Logged in only.

| Method + path | Success | Errors |
| --- | --- | --- |
| `GET /api/v1/exercises/:id` | `200 { exercise, attempt }` | `404 EXERCISE_NOT_FOUND` |
| `GET /api/v1/mastery?language=cpp` (`language` optional) | `200 { skills: SkillMastery[] }`: only skills the learner has evidence on | none |
| `GET /api/v1/mastery/:skillId?language=cpp` (default `cpp`) | `200 SkillMastery & { history }`: zeros for a skill never practised | `404 SKILL_NOT_FOUND` |

**Opening an exercise starts the attempt.** Call `GET /exercises/:id` when the exercise page loads and keep `attempt.id` for Submit. Calling it again returns the same attempt. If `attempt.status === "solved"`, show "Solved ✅" and the next step instead of the editor.

```ts
type Exercise = {
  id: string; title: string; promptMd: string; // render as Markdown
  starterCode: string; functionSignature: string | null; // put starterCode in the Monaco editor
  rung: 1 | 2 | 3 | 4 | 5; languageCode: "cpp"; timeLimitMs: number; memoryLimitMb: number;
  skill: { id: string; name: string; slug: string };
  sampleTests: Array<{ seq: number; name: string; input: string | null; expectedOutput: string | null }>;
};
type Attempt = { id: string; status: "active" | "solved" | "abandoned"; hintLevel: number; hintCeiling: number; submissionCount: number };

type Dimension = { score: number; effective: number; lastEvidenceAt: string | null }; // show `effective` (0–1)
type SkillMastery = {
  skill: { id: string; name: string; slug: string }; languageCode: string;
  reading: Dimension; writing: Dimension; // ALWAYS two separate bars, never one combined number
  clearedAt: string | null; attemptCount: number; successCount: number;
  history?: Array<{ dimension: "reading" | "writing"; verdict: string | null; rung: number | null; hintsUsed: number; scoreBefore: number; scoreAfter: number; createdAt: string }>;
  // verdict and rung are null for the placement test's starting scores: show "Placement test"
};
```

- **`effective`** is the score after forgetting (it drops a little every day without practice). **`score`** is the stored one. Show `effective` as a percentage, and `clearedAt` as a "Cleared" badge.
- Rung 1 (predict the output) is a text answer, not code: show a textbox instead of the editor. Its `sampleTests` is always empty (its only test is the answer).

## 4d. Help fading (live, 16 Oct)

`GET /api/v1/scaffolding/state?language=cpp` (`language` optional) → `200 { skills: FadeState[] }`, for skills the learner has opened.

```ts
type FadeState = {
  skill: { id: string; name: string; slug: string }; languageCode: string;
  stage: number; totalStages: number;   // show "Stage 2 of 4"
  description: string | null;           // e.g. "Complete code"
  minRung: number;                      // easiest exercise level at this stage
  maxHintLevel: number;                 // most hints allowed now (5 = solution can be shown)
  advanceRung: number; advanceMaxHints: number; // "Solve a level-3 exercise with at most 1 hint to move on"
  stageEnteredAt: string;
};
```
- Stages only go **up**: after an AC on `advanceRung` (or harder) with at most `advanceMaxHints` hints, or when the placement test proves a skill in code (it starts on the last stage). Show the learner the next goal, e.g. "Solve a level 3 exercise with ≤1 hint to unlock less help".
- An attempt keeps the hint ceiling it started with (`attempt.hintCeiling`); the next exercise uses the new stage.

## 4e. What to do next (live, 17 Oct)

`GET /api/v1/recommendations/next?course=cpp-basics&language=cpp` (both optional; those are the defaults) → `200 { recommendation }`

```ts
type Recommendation = {
  id: string;
  skill: { id: string; slug: string; name: string };
  rung: 1 | 2 | 3 | 4 | 5;
  reason: "new_skill" | "review";   // show "Review" for reviews
  exerciseId: string | null;         // null: no exercise ready for this skill yet
} | null;                            // null: the course is done
```

- **Dashboard "What next" card:** call this, show the skill name, the rung ("Level 2 of 5") and, for reviews, a "Review" badge. The button opens `/exercise/{exerciseId}`, which calls `GET /exercises/:id` (that starts the attempt).
- If the learner has an unfinished attempt, this returns **the same exercise** again, so it doubles as "continue where you left off".
- `exerciseId: null`: show "New exercises for this skill are being prepared" (the server has queued one; ask again in a minute). `recommendation: null`: show "Course complete".
- `404 COURSE_NOT_FOUND` for an unknown course.

## 4f. Placement test (live, 18 Oct)

Logged in only. All three are `POST`, under `/api/v1/diagnostic`.

| Call | Body | Success |
| --- | --- | --- |
| `/start` | `{ course?: "cpp-basics", language?: "cpp", retake?: false }` (all optional) | `200 { diagnostic: InProgress \| Completed }` |
| `/:id/answers` | `{ itemId, answer }` or `{ itemId, dontKnow: true }` | `200 { diagnostic: InProgress }`, carrying the next question |
| `/:id/complete` | none | `200 { diagnostic: Completed }`, or `202 { diagnostic: Grading }` |

```ts
type Question = {
  itemId: string;
  dimension: "reading" | "writing";
  skill: { slug: string; name: string };
  promptMd: string;                   // render as Markdown
  code: string;                       // reading: the program to read (read-only); writing: the starter code (Monaco)
  functionSignature?: string;         // writing only
  sample?: { input: string | null; expectedOutput: string }; // writing only: one example
};
type InProgress = { diagnosticId: string; attemptNo: number; status: "in_progress"; answered: number; question?: Question };
type Completed = {
  diagnosticId: string; attemptNo: number; status: "completed"; completedAt: string;
  results: Array<{ skill: { id: string; slug: string; name: string }; estReading: number; estWriting: number; confidence: number }>;
};
type Grading = { diagnosticId: string; status: "grading"; retryAfterMs: number };
```

- **One question at a time.** Show `question`; when there is none, call `/complete`. The test is adaptive, so there is no "question 5 of 20": show `answered` and a "Finish now" button instead (it calls `/complete`; ask "Are you sure?" first, because unanswered skills start from zero).
- **Reading** (predict the output): a textbox, compared like rung 1. Add an **"I don't know"** button that sends `dontKnow: true`. It's better than guessing: guesses cost an extra question.
- **Writing:** the editor with `code`, plus a **"Skip this task"** button (`dontKnow: true`). The reply comes at once, with the next question: the code runs in the background, and nothing tells the learner whether an answer was right.
- **`/complete` → `202`:** show "Checking your code…" and call `/complete` again after `retryAfterMs`. It always ends within about 2 minutes.
- **Results page:** `results` lists the skills the test placed (skills already cleared in practice are left out). For each, `estWriting > 0` → "Fast-tracked: one Build to clear it"; `estReading > 0` only → "Starts at level 2"; otherwise "Starts from the beginning". Then go to the dashboard ("What next").
- **`/start` is also "where am I".** It resumes a test in progress, or returns the last result. It starts a new test only the first time, or with `retake: true` (3 attempts per course). Use the result to choose "Take the placement test" or "Retake".
- **`409 ITEM_NOT_CURRENT`** (two tabs, or a double click on an old question): call `/start` and show the question it returns.

## 4g. Study sessions (live, 19 Oct)

Logged in only.

| Call | Body | Success |
| --- | --- | --- |
| `POST /api/v1/sessions` | `{ course?: "cpp-basics", language?: "cpp" }` (optional) | `200 { session: Session }`: resumes the open session, or starts one |
| `GET /api/v1/sessions/active` | none | `200 { session: Session \| null }` |
| `PATCH /api/v1/sessions/:id` | `{ status: "paused" \| "active" \| "ended" }` | `200 { session: Session }` |

```ts
type Session = {
  id: string;
  status: "active" | "paused" | "ended";
  startedAt: string; lastActiveAt: string;
  activeMs: number;                  // study time; idle gaps don't count
  endedAt: string | null; endReason: "user" | "idle" | "completed" | null;
  step: {
    id: string; seq: number; kind: "exercise" | "review";
    skill: { id: string; slug: string; name: string };
    rung: 1 | 2 | 3 | 4 | 5;
    exerciseId: string;              // open /exercise/{exerciseId}
  } | null;                          // null: the next exercise is being prepared, or the session ended
};
```

- **"Start studying" button:** `POST /sessions`, then open `step.exerciseId`. After a solve (or when the learn page loads), call `GET /sessions/active`: it moves to the next step by itself once the current exercise is solved.
- **Pause/Resume/End buttons:** `PATCH` with the status. Resuming returns the **same step**. Show `activeMs` as study time.
- **Idle:** 15 minutes without a call pauses the session (show "Resume"); after 24 hours paused it ends, and `GET /sessions/active` returns `null` → show "Start studying".
- `status: "ended"` with `endReason: "completed"`: show "Course complete".
- `409 SESSION_ENDED` on PATCH: the session already ended; call `POST /sessions` for a new one.

## 4h. Progress (live, 19 Oct)

`GET /api/v1/progress?course=cpp-basics&language=cpp` (both optional) → `200 Progress`

```ts
type Progress = {
  course: { slug: string };
  summary: { total: number; locked: number; ready: number; in_progress: number; cleared: number; review_due: number };
  skills: Array<{
    skill: { id: string; slug: string; name: string; difficulty: number };
    prerequisites: string[];                        // skill ids: draw the graph edges from these
    reading: { score: number; effective: number };  // effective = today, after forgetting (show this)
    writing: { score: number; effective: number };
    stage: number | null;                           // fade stage, null if never opened
    status: "locked" | "ready" | "in_progress" | "cleared" | "review_due";
  }>;
};
```

- **Skill graph:** one node per skill, edges from `prerequisites`, coloured by `status`. Always print the label and the numbers too, never colour alone (accessibility).
- **Two bars per skill, Reading and Writing, never combined** (FR-M11-02). Show `effective` as a percentage, honestly: no rounding up.
- `review_due`: "Review" badge. `locked`: "Finish its prerequisites first".

## 4i. Admin analytics (live, 19 Oct)

Admins only (`user.role === "ADMIN"`; everyone else gets `403 FORBIDDEN`). Make the first admin with `pnpm --filter @ai-tutor/api user:admin <email>`, then log in again.

`GET /api/v1/analytics/overview?days=30&course=cpp-basics` (all optional; `days` 1–365) → `200 Overview`

```ts
type SkillRef = { slug: string; name: string };
type Overview = {
  window: { days: number; since: string };
  learners: { total: number; joined: number; ranCode: number; pendingParent: number; consented: { researchStudy: number; aiTraining: number } };
  study: { sessions: number; studyMinutes: number; placementStarted: number; placementCompleted: number };
  runs: { submissions: number; byVerdict: Record<string, number>; medianRunMs: number | null; sandboxErrorRate: number }; // byVerdict keys: AC, WA, CE, RE, TLE, MLE, SE, pending
  outcomes: {
    skillsCleared: number;
    stageMoves: Record<string, number>;              // "solved": help faded through practice
    skills: Array<{ skill: SkillRef; learners: number; avgReading: number; avgWriting: number; cleared: number }>;
  };
  content: { skills: Array<{ skill: SkillRef; byRung: Record<"1" | "2" | "3" | "4" | "5", number>; total: number }>; skillsWithoutExercises: number };
  hardest: Array<{ exerciseId: string; title: string; skill: SkillRef; rung: number; attempts: number; solveRate: number }>;
  hints: { delivered: number; live: number; frozen: number; generic: number; blocked: number; deniedCeiling: number; bottomedOut: number };
  generation: {
    succeeded: number; fellBack: number; pending: number;
    failuresByStage: Record<string, number>;          // llm, schema, compile, reference, tests_too_weak, sandbox
    bySkill: Array<{ skill: SkillRef; rung: number; succeeded: number; fellBack: number; pending: number }>;
  };
  ai: {                                               // this calendar month, not the window
    spentThisMonthInr: { hints: number; generation: number };
    monthlyBudgetInr: { hints: number; generation: number };   // 500 and 300
  };
};
```

- One page, five cards: Learners, Code runs (a verdict bar chart; warn if `sandboxErrorRate > 0.05`), Outcomes (reading vs writing bars per skill), Content (a skill × rung grid, empty cells highlighted), Hardest exercises.
- A window selector (7 / 30 / 90 days) sets `days`.

## 4j. Hints (live, 19 Oct)

`POST /api/v1/exercises/:id/hints` with `{ code?: string }` (the editor's current code, or the rung-1 prediction) → `200 { hint: Hint }`

```ts
type Hint = {
  level: 1 | 2 | 3 | 4 | 5;   // 1 idea · 2 where · 3 how · 4 worked example · 5 the answer
  ceiling: number;            // the most this attempt allows (from the fade stage)
  bodyMd: string;             // render as Markdown
  source: "live" | "frozen" | "generic" | "answer";
};
```

- **"Get a hint" button:** always send the current code, so the tutor talks about *their* work. Each press gives the **next** level only. Show the text under the editor and keep earlier hints visible.
- Disable the button while waiting (a second press gets `409 HINT_CHANGED`), and when `level === ceiling` ("No more hints at this stage").
- **Before level 5,** ask "Show the answer? This exercise won't count towards your progress." Level 5 is the full answer.
- After a compile error, show the button more prominently: the tutor explains the compiler's message.
- `409 HINT_LIMIT`: the stage's ceiling is reached. `404 ATTEMPT_NOT_FOUND`: open the exercise first (`GET /exercises/:id`).

## 4k. Exercise generation (live, 19 Oct; admins and authors)

| Call | Body | Success |
| --- | --- | --- |
| `POST /api/v1/exercises/generate` | `{ skill: "vectors", rung: 1–5, course?, language? }` | `202 { job: GenerationJob }` |
| `GET /api/v1/exercises/generation/:jobId` | none | `200 { job: GenerationJob }` |

```ts
type GenerationJob = {
  id: string; skill: { slug: string; name: string }; rung: number;
  status: "queued" | "generating" | "verifying" | "succeeded" | "fell_back";
  trigger: "pregen" | "on_demand";          // pregen = an admin asked; on_demand = queued by the recommender
  tries: number; model: string;
  exerciseId: string | null;                // set when succeeded: the new, verified exercise
  fallbackExerciseId: string | null;        // set when it fell back to a hand-written one
  failures: Array<{ tryNo: number; stage: string; reason: string | null }>;
  createdAt: string; finishedAt: string | null;
};
```

- **Admin "Content" page:** pick a skill and rung, press "Generate", then poll the job every few seconds until `succeeded` or `fell_back`. A job takes about a minute (writing, then about 5 sandbox runs). Asking again while one runs returns the same job.
- `503 GENERATION_UNAVAILABLE` until billing is on; `503 GENERATION_BUDGET_REACHED` when this month's ₹300 is spent.
- Learners never call these: the recommender queues missing exercises by itself.

## 5. Screens and flow

| Moment | Do this |
| --- | --- |
| Sign-up submit | `POST /register` → on `201`: if `user.status === "pending_parent"` show "Ask a parent or guardian to approve your account" (the parent email step comes next); otherwise go to `/login` with "Account created, please log in". On `409` show "Already registered" + a link to login |
| Login submit | `POST /login` → on `204` call `GET /me`, keep the user in app state, go to the dashboard. First time on the dashboard: `POST /diagnostic/start` and offer the placement test if it is `in_progress` with no answers yet. On `401` show `error.message` (it never says which field was wrong, on purpose) |
| App starts | `GET /me` → `200` logged in; `401` (after one refresh try) logged out |
| Any call returns `401` | Call `POST /refresh` **once**, then retry the call. If refresh fails, clear the user and go to `/login` |
| Logout | `POST /logout`, clear the user, go to `/login` |
| `429` | Show the message and disable the button for a few seconds |
| Admin pages | Hide them unless `user.role === "ADMIN"`. The server checks roles too; hiding is only for UX |

## 6. A ready-made fetch helper

Put this in `apps/web/src/lib/api/client.ts`. It unwraps the envelope, refreshes the session once on `401` (one refresh at a time, even with many open requests), and throws a typed error.

```ts
export type ApiErrorBody = { code: string; message: string; details?: unknown };

export class ApiError extends Error {
  constructor(readonly status: number, readonly body: ApiErrorBody) {
    super(body.message);
  }
}

const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh"];
let refreshing: Promise<boolean> | null = null;

// Many requests can fail at once; they all wait for the same single refresh.
const refreshSession = () =>
  (refreshing ??= fetch("/api/v1/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .finally(() => (refreshing = null)));

export async function api<T = void>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (res.status === 204) return undefined as T;

  const body = await res.json();
  if (body.success) return body.data;

  if (res.status === 401 && !retried && !NO_REFRESH.includes(path) && (await refreshSession())) {
    return api<T>(path, init, true);
  }
  throw new ApiError(res.status, body.error);
}
```

Usage:

```ts
await api("/auth/register", {
  method: "POST",
  body: JSON.stringify({ email, password, displayName, dateOfBirth, acceptTerms, acceptPrivacy, aiTraining, research }),
});
await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
const { user } = await api<{ user: User }>("/auth/me");
await api("/auth/logout", { method: "POST" });
```

## 7. Planned endpoints

All 23 MVP endpoints are live. Live AI (hints and generation) switches on once Gemini billing is active (7 November).

## 8. Error codes

| Code | HTTP | Meaning | UI |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | A field is wrong | Show `details` next to the fields |
| `INVALID_JSON` | 400 | Body wasn't JSON | Bug in our code |
| `BODY_TOO_LARGE` | 413 | Request body over 100 KB | Show "Your code is too long" |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password | Show the message |
| `UNAUTHENTICATED` | 401 | Not logged in, or the session ended | Refresh once, else go to login |
| `TOKEN_EXPIRED` | 401 | The 15-minute access token expired | Refresh once (the helper does it) |
| `PARENT_APPROVAL_PENDING` | 403 | Under-18 account not yet approved by a parent | Show "Waiting for your parent or guardian to approve" |
| `BAD_ORIGIN` | 403 | Request didn't come from our site | Bug: you called the API directly instead of through `/api` |
| `EMAIL_TAKEN` | 409 | Email already registered | Link to login |
| `EXERCISE_NOT_FOUND` / `SKILL_NOT_FOUND` | 404 | Doesn't exist, or isn't ready | Show "Not found" and a link back |
| `COURSE_NOT_FOUND` | 404 | No such course in that language | Bug: check the course slug and language |
| `DIAGNOSTIC_NOT_FOUND` | 404 | Not your placement test | Call `/diagnostic/start` |
| `DIAGNOSTIC_CLOSED` | 409 | The placement test is already finished | Show the results (`/diagnostic/start`) |
| `ITEM_NOT_CURRENT` | 409 | Answered an old question | Call `/diagnostic/start` and show its question |
| `DIAGNOSTIC_LIMIT` | 409 | No placement retakes left | Hide the "Retake" button |
| `DIAGNOSTIC_UNAVAILABLE` | 503 | The placement test isn't ready yet | Skip it and go to the dashboard |
| `HINT_LIMIT` | 409 | No more hints at this fade stage | Disable "Get a hint", suggest another run |
| `HINT_CHANGED` | 409 | A hint was just given (double press) | Ignore; keep the hint already shown |
| `FORBIDDEN` | 403 | Not allowed for this role (e.g. analytics for a learner) | Hide the page; it's admin-only |
| `GENERATION_UNAVAILABLE` / `GENERATION_BUDGET_REACHED` | 503 | Live AI is off, or this month's generation budget is spent | Show the message on the admin page |
| `GENERATION_JOB_NOT_FOUND` | 404 | No such generation job | Reload the admin page |
| `SESSION_NOT_FOUND` | 404 | Not your session | Call `GET /sessions/active` |
| `SESSION_ENDED` | 409 | The session already ended | Call `POST /sessions` |
| `ATTEMPT_NOT_FOUND` / `SUBMISSION_NOT_FOUND` | 404 | Not yours, or doesn't exist | Reload the exercise |
| `ATTEMPT_CLOSED` | 409 | Exercise already solved | Show "Solved" and the next step |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Bug: a key was reused for different code | Make a new key per Submit |
| `RATE_LIMITED` | 429 | Too many tries | Ask to wait |
| `INTERNAL_ERROR` | 500 | Server bug | "Something went wrong", tell Ashwani |
