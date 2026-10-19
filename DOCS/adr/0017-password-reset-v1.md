# ADR-0017: Password reset ("forgot password"), v1

- **Status:** Accepted, built (real emails start once the Brevo key is in `apps/api/.env`)
- **Date:** 19 Oct 2026
- **Decided by:** Ashwani Kumar Puri (email provider, link lifetime, frontend wiring)
- **SRS links:** FR-M1-05 (Should); ADR-0006, ADR-0008

## Decisions made
1. **Email: Brevo**, through its HTTP API with plain `fetch` (`infrastructure/mail/mailer.ts`), no SDK. The free plan sends 300 emails a day. Without a key outside production, the email is printed in the API terminal, so the flow works locally; in production the API refuses to start without it.
2. **A link works once, for 30 minutes.**
3. **Frontend wired with the backend:** Aman's forgot-password form now calls the API, and a new `/reset-password` page (same look as the other auth pages) sets the new password.

## How it works
| Step | Rule |
|---|---|
| Ask | `POST /auth/forgot-password { email }` answers `202` with the same message for every email. The lookup, the link and the email all happen after the reply, so neither the reply nor its timing says whether an account exists (as for login, ADR-0008) |
| Link | 32 random bytes; only the SHA-256 is stored (`password_reset_tokens`), as for refresh tokens. A new request deletes the account's unused links, so only the latest email works. Accounts that aren't active (for example, waiting for a parent) get no email |
| URL | `WEB_ORIGIN/reset-password#token=…`. The token is in the `#fragment`, which browsers never send to a server or put in a Referer header, so it stays out of server, proxy and analytics logs |
| Email | Subject, a button and the plain link. **No name:** the email provider gets only the address (privacy policy §5) |
| Reset | `POST /auth/reset-password { token, password }` → `204`. One transaction marks the link used (a conditional update, so a double click can't use it twice), saves the new argon2id hash, ends the account's other unused links and **revokes every refresh token**: a session stolen with the old password ends with it |
| Refused | A used, expired, replaced or unknown link → `400 RESET_LINK_INVALID` |
| Limits | Asking: 5 per IP per 15 minutes, and **one email per account every 5 minutes**: asking again sooner gets the same reply but sends nothing, because the recent link still works. That caps the emails one inbox can get without a per-email limit that anyone could fill to lock its owner out of recovery. Resetting: 10 per IP per 15 minutes |

## Notes
- An access token issued before the reset still works until it expires (at most 15 minutes, ADR-0008).
- Known v1 limit: a login or token refresh already in flight when the reset commits can still finish and keep its new session (a window of about a tenth of a second). Closing it needs a token version on `users`.
- Per-IP limits need the real client IP: how the API gets it, and what Caddy and Vercel must do, is in ADR-0008 ("Client IP behind proxies").
- A failed send is logged as `Password reset link failed` with Brevo's reason; the learner can simply ask again.
- Used and expired links are kept 1 year as security records, then deleted with old refresh tokens (DPDP doc §4, job to build). An account's links are deleted with the account.
- Not in v1: changing the password while logged in (spec API 6) and verifying the email at sign-up.
