# ADR-0018: Data rights (see, correct, download, delete, opt in and out), v1

- **Status:** Accepted, built
- **Date:** 19 Oct 2026
- **Decided by:** Ashwani Kumar Puri (what deletion keeps, how it is confirmed, when it happens, opt-in switches)
- **Links:** DPDP Act 2023 s.6 and s.11–13; `DOCS/legal/dpdp-compliance.md` §4–5; privacy policy §3, §8, §9; ADR-0006, ADR-0008, ADR-0017

## Decisions made
1. **Deletion follows the DPDP doc.** The person is erased: email, name, password, date of birth and all code. Progress numbers stay, anonymous, only if the learner opted in to research or AI training; otherwise every learning row goes. Consent records stay as proof, under the anonymous ID.
2. **Confirmed with the password.** `DELETE /me` asks for the password again, so an open laptop or a stolen session alone can't delete an account.
3. **A 7-day grace period.** Nothing is erased for 7 days; logging in again cancels the request. An hourly job erases what is due.
4. **Opt-ins switch on and off.** AI training and research can be turned on and off at any time, adults only. The required consents end only with the account.

## Endpoints (base `/api/v1/me`, all need a login)
| Endpoint | Does | Notes |
|---|---|---|
| `PATCH /me { displayName?, timezone? }` | Correction (s.12) | IANA time zone; the hidden personal organisation is renamed too (sign-up copied the name there). Email and date of birth can't be changed here |
| `GET /me/consents` | The live consents | `{ consents: [{ kind, policyVersion, grantedAt }] }` |
| `PUT /me/consents/:kind` | Opt in | `ai_training` or `research_study`; adults only (`403 ADULTS_ONLY`); a second PUT keeps the first grant. 30 switches an hour, so the kept proof rows stay bounded |
| `DELETE /me/consents/:kind` | Opt out (s.6(4)) | The row is revoked, never deleted, so it proves what was agreed and when it ended. Other kinds get `400`: they end with the account |
| `GET /me/data` | Access (s.11) | A JSON file (`ai-tutor-my-data.json`, `no-store`): the summary, purposes and named providers, then every row each module holds. Never a password or token hash, never hidden test data. 5 per hour |
| `DELETE /me { password }` | Erasure (s.12) | `202 { eraseAfter }`; every login ends, an email (no name) gives the date and says logging in cancels. Wrong password: `403 WRONG_PASSWORD`; 5 tries per 15 minutes |

## How erasure works
| Step | Rule |
|---|---|
| Request | `users.deletion_requested_at` (migration 0014) is set; every refresh token is revoked. Until the next login, a refresh is refused (even one still in its 20-second grace) and `GET /auth/me` answers `401` |
| Cancel | A successful login clears the request, but only on an active account. A login that read the account just before erasure closed it fails (`401`) instead of opening a session |
| Due | An hourly BullMQ job scheduler (`erasure` queue, upserted at start, so restarts never add a second one) erases accounts asked more than 7 days ago |
| 1. Close | One transaction: email `deleted-<id>@deleted.invalid`, name "Deleted learner", the hash of a random password, no date of birth, default time zone, status `deleted` (a new `user_status` value); the personal organisation is renamed; refresh tokens are ended. Sign-in records (refresh and reset tokens: times, IP, device) stay a year under the anonymous ID, as the DPDP Rules ask of security logs and privacy policy §9 says, and then go with the security-log job. Only if the request still stands, so a login just before it wins |
| 2. Modules | Each module erases its own rows through its service, children first: M4 evidence and mastery, M12 fade, M3 placement, M8 hints, M7 runs, submissions and attempts, M9 sessions, M5 recommendations, M3 enrollments |
| 3. Finish | Every consent is revoked (kept as proof); the request is cleared |

| With an opt-in to research or AI training | Without one |
|---|---|
| Rows stay, but code, compile output, test output, live hint text, typed placement answers and the enrollment goal are emptied | Every learning row is deleted |

Every step can run twice: if one fails, the account is simply tried again the next hour, and one failing account never holds up the others.

## Notes
- An access token issued before `DELETE /me` gets `401` from the `/auth/me` and `/me` endpoints at once; the other endpoints check only the token, so it works there until it expires (at most 15 minutes, ADR-0008).
- Erased accounts get `deleted-<id>@deleted.invalid`, so sign-up refuses every `.invalid` address (a reserved domain): nobody can take one first and block an erasure.
- A test lists every table that points at a user or a learner's rows and how erasure treats it; a new table fails it until its module exports and erases it.
- Security review (19 Oct): no critical or high findings; the medium ones are fixed as above. Left as they are, on purpose: the download has the code but not the sandbox output (it is derived from the code and our tests, and hidden tests must stay hidden; the app shows it per submission); with an opt-in, `answer_sha256` and the sandbox ids stay (the account is anonymous by then); the download loads everything in memory (fine at pilot size); a failed erasure is only logged, as `Erasing account <id> failed`, until we have alerts.
- `review_items` and `calibration_records` have no writer yet. Their module adds its export and erase step when it gets one; until then a forgotten step fails loudly (a foreign key stops the delete), and the erasure tests catch it.
- Whether the numbers stay is decided at erasure time, from the opt-ins live then.
- The download is a file, so it skips the API envelope; errors still use it.
- Still to build (DPDP doc §4): the code purge when a skill is cleared, the 3-year inactivity job, the 1-year security-log cleanup and deleting pending child sign-ups after 7 days.
- Not in v1: changing the email or date of birth (by email to `privacy@`), nominating someone (by email), and a parent acting for a child (with the parental flow).
