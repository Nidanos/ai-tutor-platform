# DPDP compliance (internal)

> How Nidanos meets the **DPDP Act, 2023** and **DPDP Rules, 2025**. Internal working doc: keep it current, review it every quarter.
> **When it applies:** most duties start about **13 May 2027** (18 months after the Rules were notified in Nov 2025; confirm the date in the Gazette). We build them in now because doing it later is harder.

## 1. Our role
- **Data Fiduciary:** Nidanos. It decides why and how learner data is processed.
- **Data Processors:** the vendors in section 6, working only on our instructions under written contracts.
- **Institutions:** when a college buys seats, decide per contract who is fiduciary for its students. Default: the institution is fiduciary for enrolment, and Nidanos is processor for teaching.
- We're not a "Significant Data Fiduciary" unless the Government names us. If it does, we'd also need a DPO, audits and DPIAs.

## 2. Obligations → how we meet them
| # | Obligation | How | Status |
|---|---|---|---|
| 1 | Standalone, plain-language notice (Rule 3) | [privacy-policy.md](privacy-policy.md) | Draft |
| 2 | Consent: free, specific, informed, unbundled; withdrawal as easy as giving (s.6) | Separate tick boxes per purpose (built: register, migration 0012); opt-ins switch on and off with `PUT`/`DELETE /me/consents/:kind` (built, ADR-0018); the Settings screen (to build) | API built |
| 3 | Children: verifiable parental consent; no tracking or ads (s.9, Rule 10) | [parental-consent.md](parental-consent.md) | To build (until then, sign-up refuses under-18s: the pilot is adults only) |
| 4 | Reasonable security safeguards (s.8(5), Rule 6) | Section 7 | Partly built |
| 5 | Breach notice to the Board and each affected user (s.8(6), Rule 7) | [breach-response-plan.md](breach-response-plan.md) | Draft |
| 6 | Erase when the purpose ends; 48-hour warning (s.8(7), Rule 8) | Section 4 | Account delete built; other jobs to build |
| 7 | Rights: access, correction, erasure, nomination, grievance (s.11–14) | Section 5 | API built (nomination and grievance by email) |
| 8 | Published contact for questions (s.8(9)) | Aditi Tanwar, `grievance@[DOMAIN]` | Draft |
| 9 | Processor contracts (s.8(2)) | Section 6 | To do |
| 10 | Keep logs at least 1 year (Rule 6) | Section 4 | To build |
| 11 | Transfers abroad allowed except to restricted countries (s.16) | Vendor list checked against the Government's list | Ongoing |

## 3. Data inventory
| Table(s) | Personal data | Purpose | Consent | Retention |
|---|---|---|---|---|
| `users` | email, display name, password hash, timezone, DOB, last login | Account, sign-in, age check | core | Until deleted, or 3 years inactive |
| `refresh_tokens` | IP, user agent, client, times | Security, theft detection | core | Expired rows kept 1 year, then deleted |
| `password_reset_tokens` | token hash (never the token), request and use times | Password reset, security | core | Each new request replaces unused links; rows deleted 1 year after expiry |
| `enrollments` | courses, language, goal text | Teaching | core | With the account |
| `exercise_attempts`, `submissions`, `sandbox_runs`, `run_test_results`, `hint_events` | code, verdicts, timings, hint use | Grading, mastery | core | Code purged when the skill is cleared; the rest stays with the account |
| `lesson_notes` | a short AI-written note about the learner's level and recent results (no code) | Teaching | core | Always erased with the account, even when anonymous numbers are kept (ADR-0019) |
| `learning_sessions`, `session_steps`, `recommendations`, `skill_scaffolding`, `fade_stage_changes` | activity times, recommendation scores | Adapting lessons | core | With the account |
| `diagnostic_*` | answers, timings, estimates | Placement | core | With the account |
| `mastery_records`, `evidence_events`, `review_items` | skill scores, evidence | Adapting, spaced review | core | With the account |
| `calibration_records` | self-ratings vs results | Teaching (self-assessment) + research if opted in | core / research | With the account |
| `consents` | kind, notice version, times | Proof of consent | n/a (legal duty) | Up to 3 years after account deletion, linked to an anonymous ID |
| `llm_calls` | **no personal data** (model, tokens, cost) | Cost control | n/a | 1 year |

**Consent kinds** (`consent_kind` enum, all built in migration 0012; policy version `0.1`):

| Kind | Required? | Who |
|---|---|---|
| `data_processing` | Yes (core) | Everyone; a parent for minors |
| `terms` | Yes | Everyone; a parent for minors |
| `parental` | Yes, if under 18 | Parent account |
| `ai_training` | Optional, default off | Adults only |
| `research_study` | Optional, default off | Adults only |

## 4. Retention and erasure jobs
| Job | Rule | Status |
|---|---|---|
| Inactivity | 3 years without sign-in → email 48 hours before → anonymise. Signing in cancels it. | To build |
| Code purge | `answer`, and the compiler and error text that can quote it, emptied as soon as the clearing submission is graded, and any later code for that skill once graded (`answer_purged_at`). Program output and verdicts stay | **Built** (20 Oct, ADR-0007) |
| Pending child sign-ups | Not approved in 7 days → delete | Not needed while sign-up refuses under-18s |
| Security logs | Delete `refresh_tokens` and `password_reset_tokens` rows 1 year after expiry | To build |
| **Account delete (anonymise)** | `DELETE /me` with the password; 7 days later (logging in cancels it) an hourly job erases email, name, password hash, DOB and all code, and ends every token. Sign-in records (tokens' times, IP, device) stay 1 year under the anonymous ID (Rule 6 logs), then go with the security-log job. Progress numbers stay only if the user opted in to research or training, otherwise they are deleted. Consent rows stay, revoked, under the anonymous user ID | **Built** (ADR-0018) |

## 5. Rights procedure
| Request | Endpoint *(built, ADR-0018)* | Manual path |
|---|---|---|
| Access (summary + data) | `GET /me/data` (JSON download) | Email → verify identity from the account email → send within 30 days |
| Correction | `PATCH /me` (name, time zone) | Email (email address, date of birth) |
| Erasure | `DELETE /me` (password, then 7 days) | Email → confirm → anonymise |
| Withdraw consent | `DELETE /me/consents/:kind` (opt-ins; the rest by deleting the account) | Email |
| Nomination | none yet | Email: record the nominee in the grievance log |
| Grievance | none | `grievance@[DOMAIN]` → acknowledge within 48h → resolve within 30 days (legal maximum 90) → log it |

**Grievance log:** a private spreadsheet with date, user, request, response date and outcome. Aditi owns it.

## 6. Vendor (processor) register
| Vendor | Data | Region | Contract or DPA | Status |
|---|---|---|---|---|
| Database: Supabase (on AWS), ADR-0024 | Everything, stored | India (Mumbai) | Supabase DPA | To accept |
| Application hosting: Render, ADR-0024 (an own VM later, ADR-0010) | Everything, while processed; no storage | Singapore | Render DPA | To accept |
| Web hosting: Vercel (college phase) | Requests and IP addresses; no database | Global edge | Vercel DPA | To accept |
| Code editor files: jsDelivr (CDN), 31 Oct | IP address and browser details when the editor loads; no account data | Global CDN | jsDelivr terms and privacy policy | To check; self-hosting the editor removes it |
| E2B (code sandbox) | Code + tests, no identity | Outside India (check) | E2B terms + DPA | To accept |
| AI provider: Google Gemini **paid tier** (ADR-0010) | Code + exercise context for hints; level, recent results and weak prerequisites for lesson notes (ADR-0019); no identity | Outside India | Gemini API paid terms (no training on our data) | To accept |
| Email delivery: Brevo (ADR-0017) | Email address and the email itself (a reset link), no name | EU (France, Belgium, Germany) | DPA in Brevo's terms (Appendix 3) | To accept |
| Payments `[TBD, later]` | Billing details | India | Gateway agreement | Later |

**Before adding any vendor:** check it isn't in a restricted country, accept its DPA, and add it here and to the public providers page.

## 7. Engineering rules (privacy by design)
1. **No name, email, DOB or IP in AI prompts or sandbox runs.** Send code and exercise context only.
2. No analytics or third-party scripts in the web app. Only the essential `at` and `rt` cookies. One exception for now: the code editor (Monaco) loads its files from jsDelivr, listed as a provider, until we serve them ourselves.
3. **Child accounts:** never include them in training exports, research exports or product analytics.
4. Store passwords with argon2id and tokens as SHA-256 only (built). HTTPS everywhere. Backups encrypted.
5. Never log secrets or code. Logs that contain IPs follow the 1-year rule.
6. Least privilege: only Ashwani (CTO) has production database access. Every access is logged.
7. Any new data field or purpose updates section 3 and the Privacy Policy **before** release.

## 8. Penalties if we get it wrong (DPDP Act Schedule)
| Failure | Up to |
|---|---|
| Security safeguards fail and cause a breach | ₹250 crore |
| No breach notice to the Board or users | ₹200 crore |
| Children's data duties | ₹200 crore |
| Other duties | ₹50 crore |

The Board weighs the size of the business and our good faith, so a documented, honest effort really matters. That's what this doc is for.

## 9. Before launch
- [ ] Lawyer reviews the Privacy Policy, Terms and parental flow, including a written opinion on s.9(3)
- [x] Consent kinds and DOB at register (Part 2 of the build, 14 Oct)
- [x] `GET /me/data`, `PATCH /me`, `DELETE /me`, consent withdrawal (API, 19 Oct; the Settings screens are to build)
- [ ] Retention jobs (section 4) other than account delete
- [ ] Vendor DPAs accepted and the providers page published
- [ ] `privacy@`, `grievance@`, `support@` and `security@` mailboxes live
- [ ] Breach plan rehearsed once
