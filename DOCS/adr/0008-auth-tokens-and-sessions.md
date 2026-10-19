# ADR-0008: Authentication with short JWTs and rotating refresh tokens

- **Status:** Accepted, built
- **Date:** 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **SRS links:** FR-M1-01, FR-M1-02, FR-M1-04, NFR-S3, NFR-S4

## Context
The web app comes first and a mobile app follows next year. Login has to be safe against stolen tokens, XSS, CSRF and password guessing, and stay simple enough to explain.

## Decision
| Item | Decision | Why |
|---|---|---|
| Registration | Creates the account and a hidden personal organisation, then sends the user to the login screen (no automatic login) | Ashwani's choice; keeps sign-up and login separate |
| Passwords | argon2id (library defaults: 64 MB, 3 passes). 8–128 characters, no forced symbols | Above OWASP's minimum; NIST length-over-complexity guidance |
| Access token | JWT, HS256, **15 minutes**, never stored | Checking it needs no database read; a stolen one dies quickly |
| Refresh token | 32 random bytes, **30 days**, stored only as a SHA-256 hash | A database leak doesn't give out logins |
| Rotation | Every refresh replaces the token. Tokens from one login share a `family_id` | A stolen token stops working after one use |
| Theft detection | An already-replaced token coming back revokes the whole family. A **20-second grace** allows two tabs refreshing at once | Reuse means a copy exists |
| Web transport | httpOnly cookies; the refresh cookie is only sent to `/api/v1/auth` | Page scripts can never read tokens (XSS) |
| Mobile transport | Tokens in the response body; `Authorization: Bearer` on requests | Apps don't handle cookies well; one middleware accepts both |
| Same origin | The web app reaches the API through a Next.js proxy | Cookies just work and no CORS is needed |
| CSRF | Cookie-carrying writes must come from `WEB_ORIGIN` | Browsers attach cookies automatically |
| Guessing | Rate limits: 5 failed logins per email and 20 attempts per IP per 15 minutes; throttle, never lock | A lockout would let anyone block someone else's account |
| Client IP | Only our own proxy may tell the API the caller's IP (see "Client IP behind proxies" below) | Otherwise a caller picks a new IP per request and skips every per-IP limit |
| Account discovery | A wrong email and a wrong password get the same error and the same timing | Attackers can't learn who has an account |
| Roles | Sign-up always creates a `LEARNER`; authors and admins come from a seed script | Nobody can send `"role": "ADMIN"` to promote themselves |

## Client IP behind proxies (added 19 Oct 2026)
A security review found that the self-hosted Next.js proxy (`next dev`, `next start`) passes the browser's `X-Forwarded-For` on unchanged and adds none. Confirmed in the Next 16.4 source and with a local test: under the old `trust proxy: 1`, a made-up header per request got past every per-IP limit, and without one all users shared one bucket.

Express now trusts proxies by **address**, not hop count: `loopback, uniquelocal` (this machine or the private network). A hop count of 1 would believe anyone who reached the API port directly.

| Setup | Path | Who sets `X-Forwarded-For` | `trust proxy` |
|---|---|---|---|
| Local dev | browser → `next dev` → API | the browser (untrusted) | `false`: every request is `::1`, one bucket for the one developer |
| Tests | supertest → API | the test, playing our proxy | `loopback, uniquelocal` |
| Production (ADR-0010) | browser → Vercel → Caddy → API, or app → Caddy → API | Caddy, as below | `loopback, uniquelocal` |

**To set up when deploying** (not tested yet):
- **Vercel** replaces `X-Forwarded-For` with the visitor's IP. On the `/api` rewrite, also set a secret header `X-Origin-Secret` from the env var `ORIGIN_SECRET`: a `vercel.json` route transform that lists the variable under `env`, or Vercel sends the literal text (Vercel docs, "Restricting your origin to Vercel traffic").
- **Caddy** overwrites `X-Forwarded-For` with the caller's own address by default. Keep that for everyone except requests with the right secret:
  ```caddy
  api.example.com {
  	@vercel header X-Origin-Secret {$ORIGIN_SECRET}
  	handle @vercel {
  		reverse_proxy api:3001 {
  			header_up X-Forwarded-For {header.X-Forwarded-For} # keep Vercel's value: the visitor's IP
  			header_up -X-Origin-Secret
  		}
  	}
  	handle {
  		reverse_proxy api:3001
  	}
  }
  ```
  Without this, every web user shows up as one of Vercel's addresses and they share each per-IP limit (5 sign-ups an hour). Make the secret hex (`openssl rand -hex 32`), because Caddy pastes it into the config as text. If Caddy's access log is on, drop this header from it: Caddy hides only cookies and `Authorization` by default.
- Don't publish the API port: only Caddy reaches it, over the Compose network. A published port can make outside callers look like Docker's private gateway, which we trust. Never put `next start` on the internet without Caddy or Vercel in front.
- Set `NODE_ENV=production`. Without it the API acts as local dev: it trusts nobody, so all users share one bucket.
- After deploying, send a fake `X-Forwarded-For` through the site and straight to Caddy: the IP saved with the login (`refresh_tokens.ip`) must stay the real one.

## Consequences
- Logout revokes the whole login (the family) and clears the cookies.
- A disabled user keeps access for at most 15 minutes, until their next refresh is refused.
- Rate-limit counters live in memory, which is correct for one API process; they move to a Redis store when the API runs as several.
- The endpoint contract is in `DOCS/phase-2/MP3-System-Design.md` §7.3 and `DOCS/api/FRONTEND-GUIDE.md`.
