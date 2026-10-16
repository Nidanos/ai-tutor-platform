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
  history?: Array<{ dimension: "reading" | "writing"; verdict: string; rung: number; hintsUsed: number; scoreBefore: number; scoreAfter: number; createdAt: string }>;
};
```

- **`effective`** is the score after forgetting (it drops a little every day without practice). **`score`** is the stored one. Show `effective` as a percentage, and `clearedAt` as a "Cleared" badge.
- Rung 1 (predict the output) is a text answer, not code: show a textbox instead of the editor.

## 5. Screens and flow

| Moment | Do this |
| --- | --- |
| Sign-up submit | `POST /register` → on `201`: if `user.status === "pending_parent"` show "Ask a parent or guardian to approve your account" (the parent email step comes next); otherwise go to `/login` with "Account created, please log in". On `409` show "Already registered" + a link to login |
| Login submit | `POST /login` → on `204` call `GET /me`, keep the user in app state, go to the dashboard. On `401` show `error.message` (it never says which field was wrong, on purpose) |
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

## 7. Planned endpoints (not live yet)

Shapes will be published here when each one goes live. Use mock data until then.

| Area | Endpoint | For the screen |
| --- | --- | --- |
| Diagnostic | `POST /diagnostic/start`, `POST /diagnostic/:id/answers`, `POST /diagnostic/:id/complete` | Placement test |
| Next step | `GET /recommendations/next` | "What to do next" card |
| Exercise generation | `POST /exercises/generate`, `GET /exercises/generation/:jobId` | Shown while a new exercise is prepared |
| Hints | `POST /exercises/:id/hints` | "Get a hint" button. The server decides the level and returns one hint |
| Sessions | `POST /sessions`, `GET /sessions/active` | Start or resume studying |
| Progress | `GET /progress` | Progress page and skill graph |
| Fade | `GET /scaffolding/state` | Show how much help each skill currently allows |
| Analytics | `GET /analytics/overview` | Admin-only analytics page |

## 8. Error codes

| Code | HTTP | Meaning | UI |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | A field is wrong | Show `details` next to the fields |
| `INVALID_JSON` | 400 | Body wasn't JSON | Bug in our code |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password | Show the message |
| `UNAUTHENTICATED` | 401 | Not logged in, or the session ended | Refresh once, else go to login |
| `TOKEN_EXPIRED` | 401 | The 15-minute access token expired | Refresh once (the helper does it) |
| `PARENT_APPROVAL_PENDING` | 403 | Under-18 account not yet approved by a parent | Show "Waiting for your parent or guardian to approve" |
| `BAD_ORIGIN` | 403 | Request didn't come from our site | Bug: you called the API directly instead of through `/api` |
| `EMAIL_TAKEN` | 409 | Email already registered | Link to login |
| `EXERCISE_NOT_FOUND` / `SKILL_NOT_FOUND` | 404 | Doesn't exist, or isn't ready | Show "Not found" and a link back |
| `ATTEMPT_NOT_FOUND` / `SUBMISSION_NOT_FOUND` | 404 | Not yours, or doesn't exist | Reload the exercise |
| `ATTEMPT_CLOSED` | 409 | Exercise already solved | Show "Solved" and the next step |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Bug: a key was reused for different code | Make a new key per Submit |
| `RATE_LIMITED` | 429 | Too many tries | Ask to wait |
| `INTERNAL_ERROR` | 500 | Server bug | "Something went wrong", tell Ashwani |
