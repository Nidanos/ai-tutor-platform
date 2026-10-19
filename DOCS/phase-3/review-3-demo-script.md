# Review 3 demo script (Fri 23 Oct 2026)

**Goal:** in about 10 minutes, show that the core of AI Tutor works end to end on real infrastructure, and how we know it is correct. There are no learning screens yet, so the learning loop is shown through the API with a guided walk (`demo:walk`), and the web app shows sign-up, consent, the legal pages and password reset.

Suggested roles: Ashwani drives the terminal and answers the backend questions; Aman shows the web pages; Aditi takes the design and frontend-plan questions.

## The day before (Thu 22 Oct)

- [ ] Docker Desktop running, then from the repo root: `git pull`, `pnpm install`, `docker compose up -d`
- [ ] In `apps/api`: `pnpm db:migrate` and `pnpm db:seed` (nothing new should be added)
- [ ] `pnpm sandbox:smoke`: "All six verdicts correct" proves the E2B key and credit work
- [ ] `pnpm test`: 204 passed
- [ ] One full rehearsal: `pnpm demo:walk --pause`, with the API running (below)
- [ ] GitHub, Actions tab: the latest CI run on `main` is green (keep the tab open to show it)
- [ ] Laptop charged; a phone hotspot ready (E2B needs internet)
- [ ] The report PDF open at Table 8 (tests) and Figure 6 (submit code)

## 15 minutes before

1. **Restart the API.** Rate limits are counted in memory per IP, and on one laptop every request has the same IP. Sign-up allows 5 an hour, and each walk uses 2, so the rehearsals could make the live sign-up fail with `429`. A restart clears the counts.
2. Terminal 1, `apps/api`: `pnpm dev` (API and worker; reset and deletion emails print here)
3. Terminal 2, `apps/web`: `pnpm dev`
4. Terminal 3, `apps/api`: type `pnpm demo:walk --pause` but don't press Enter yet
5. Browser: `localhost:3000/register`, `/privacy`, the GitHub Actions tab, the report PDF
6. Terminal font at 18 pt or more; notifications off

## Run of show (about 10 minutes)

| Time | Show | Say |
|---|---|---|
| 0:00 | Report, section 1.2 | The problem: Learner A read code 10/11 but wrote it 0/4. One "progress" number would show about 65% and hide that. So we keep two scores, move them only on code that ran, and withdraw help as the learner improves |
| 1:00 | `/register`: a date of birth 15 years ago | The pilot is adults only, because a child's account needs a parent's approval first (DPDP s.9), and that flow comes later. The message appears next to the field |
| 1:30 | `/register`: an adult, two required boxes, the opt-ins | Consent is per purpose and recorded with the policy version. AI training and research are separate, off by default, adults only |
| 2:00 | `/privacy` | The texts we publish are built from the same files learners accept. The build fails if a draft line or a blank is left |
| 2:30 | `/login`, then "Forgot password"; the email in Terminal 1 | The reply is the same for any email, so nobody can find out who has an account. The link works once, for 30 minutes |
| 3:00 | Terminal 3: `demo:walk --pause`, one step per Enter (notes below) | The learning loop, on the real sandbox |
| 8:00 | Report Table 8; the CI run | 204 automated tests on a fresh database on every push and pull request; 140 exercises proven in the real sandbox; all 711 placement cases simulated |
| 9:00 | Report section 4.5 | Next: the learning screens (by 5 Nov), deployment, live AI once billing is active (7 Nov), and the pilot (8–10 Nov) |

**Walk notes, one line per step:**
1. *Sign up:* the same adults-only rule as the web form, enforced by the server.
2. *Placement test:* adaptive. A beginner is done in one question; an expert answers 26 instead of 40. The response never carries the answer key.
3. *What next:* fixed rules choose the skill, the level (rung 1–5) and the exercise, and every choice is saved with its reasons.
4. *Open an exercise:* opening it starts the attempt. The hint limit comes from the skill's fade stage. Only the sample test is shown; hidden tests never leave the server.
5. *Wrong answer:* a fresh, offline E2B sandbox per submission (clang 19, about 6 s). Our own judge gives the verdict. The sample test is shown in full; hidden tests show only their verdict.
6. *Hint:* one level per request, never the answer before level 5. Until billing is active the live tutor is off, so this is a general nudge; once on, a filter blocks any reply that looks like the solution.
7. *Correct answer:* writing goes 0 → 0.20 by the approved formula (0.4 × rung 3/5 × 0.85 for one hint). Reading stays 0: predicting output and writing code are separate skills.
8. *Progress:* every skill, reading and writing apart, never one number.
9. *Download my data:* the DPDP access right. One file with every module's rows and the named providers.
10. *Delete my account:* the password again, then 7 days to change one's mind. Show the email in Terminal 1. After that an hourly job erases the person and their code.

## If something goes wrong

| Problem | Do this |
|---|---|
| A step says "No verdict after a minute" (no internet, or E2B down) | Switch to the hotspot and run it again. If still down, show report A-10 (the real run of 19 Oct) and A-8 (the sandbox smoke test) |
| `429 RATE_LIMITED` | Restart the API (Terminal 1), then run again |
| `ECONNREFUSED` | Terminal 1 has stopped: `pnpm dev` again. Is Docker running? |
| A port is busy | `netstat -ano \| findstr :3001`, then end that one process by its PID |
| The hint says "generic" | Expected: live AI waits for billing (7 Nov) |

## Questions to expect

| Question | Short answer |
|---|---|
| Why two scores per skill? | Reading and writing are different abilities (Learner A: 10/11 vs 0/4). One number would hide the gap |
| Why E2B instead of Judge0 or Piston? | Isolation with the network off, a current compiler, real memory limits, and per-second billing: about ₹0.01 per submission (ADR-0003) |
| Can the AI give away the answer? | Grading, mastery and next steps are fixed code. A live hint passes a leak filter (shared solution fragments, long code, a rung-1 output). Only level 5 shows the answer, and it earns no credit |
| What if the AI is down or over budget? | Hints fall back to frozen ones, then general nudges. Generation falls back to the hand-written bank. Learners never see an error |
| How do you know it works? | 204 automated tests on every push, the real-sandbox smoke test, 140 sandbox-verified exercises, and all 711 placement cases simulated |
| Have real learners used it? | Not yet. We measured one anonymised learner as a baseline; the pilot with real learners is 8–10 November |
| Why no learning screens yet? | Backend first, with a frozen API contract and a written guide for the frontend; the screens are due 5 November |
| How do you handle personal data? | Consent per purpose, adults-only opt-ins, download, correction and deletion; no name or email ever goes to the AI or the sandbox; data stays in India |
