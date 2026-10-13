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
| Account discovery | A wrong email and a wrong password get the same error and the same timing | Attackers can't learn who has an account |
| Roles | Sign-up always creates a `LEARNER`; authors and admins come from a seed script | Nobody can send `"role": "ADMIN"` to promote themselves |

## Consequences
- Logout revokes the whole login (the family) and clears the cookies.
- A disabled user keeps access for at most 15 minutes, until their next refresh is refused.
- Rate-limit counters live in memory, which is correct for one API process; they move to a Redis store when the API runs as several.
- The endpoint contract is in `DOCS/phase-2/MP3-System-Design.md` §7.3 and `DOCS/api/FRONTEND-GUIDE.md`.
