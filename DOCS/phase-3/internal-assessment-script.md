# Internal MP3 assessment: presentation and demo script

**Goal:** in about 15 minutes, walk the faculty mentor through the report, then show the system running live at **tutor.nidanos.com**, then answer questions. The learner screens built so far are shown in the browser; the exercise loop, whose screen the team is still building, is shown through the guided API walk (`demo:walk`) against the live servers.

**Roles:** Ashwani presents the report, drives the terminal and takes backend, infrastructure and data-protection questions. Aman shows the dashboard and the placement test and takes frontend questions. Aditi shows the landing page and sign-up, and takes design questions and the legal pages (she is the Grievance Officer).

## The day before

- [ ] `https://tutor.nidanos.com` opens; `https://ai-tutor-api-sa79.onrender.com/health` says `{"status":"ok"}`; Vercel and Render show the latest deploy as live
- [ ] The pinger at cron-job.org is on (a sleeping Render service takes about a minute to wake)
- [ ] From `apps/api` on the laptop: `pnpm test` (254 passed) and `pnpm sandbox:smoke` ("All six verdicts correct")
- [ ] **Create the demo learner on the live site now, not during the demo:** sign-up allows 5 an hour per address, and the room's Wi-Fi is one address. Use an `@test.dev` email (the pilot export leaves those out), take the placement test once, and save the password
- [ ] One rehearsal of `demo:walk` against the live API (command below); it creates its own `@test.dev` learner and books its deletion at the end
- [ ] GitHub, Actions tab: the latest run on `main` is green; keep the tab open
- [ ] Laptop charged, phone hotspot ready, report PDF open at the Synopsis, Figure 12 and Table 8

**`demo:walk` against the live API** (Git Bash, repo root; reads the database address from the backup config without printing it):
```bash
(set -a; . ~/.ai-tutor-backup/config; set +a; cd apps/api && DATABASE_URL="$SUPABASE_DB_URL" API_URL=https://ai-tutor-api-sa79.onrender.com pnpm demo:walk --pause)
```

## 15 minutes before

1. Open `https://ai-tutor-api-sa79.onrender.com/health` once, so the API is awake
2. Browser tabs: `tutor.nidanos.com`, `/privacy/providers`, the GitHub Actions run, the report PDF
3. Terminal: the `demo:walk` command typed but not run; font at 18 pt or more
4. Notifications off; the demo learner's password at hand

## Run of show (about 15 minutes)

### Part A: the report (5 min)

| Time | Show | Say |
|---|---|---|
| 0:00 | Report, Synopsis | AI Tutor: an adaptive tutor whose aim is to make itself unnecessary. Thirteen modules, three user roles (learner, author, admin), C++ and data structures and algorithms first |
| 0:45 | Report 1.2 | The problem, measured: Learner A read code 10/11 but wrote it 0/4. One "progress" number would show about 65% and hide that. Platforms measure completion, not capability; AI help is unlimited and never withdrawn |
| 1:30 | Report 1.5 | Our answer: two scores per skill, reading and writing; they move only on code that actually ran and was graded; the next step comes from a prerequisite graph; hints fade as the learner improves |
| 2:15 | Report 2.1–2.3 | Incremental and iterative development, every decision written down: 24 architecture decision records. TypeScript end to end: Next.js 16 and React 19, Express 5 on Node 22, PostgreSQL with Drizzle, Redis queue, E2B sandboxes, Gemini |
| 3:00 | Figure 12 (deployment) | Live today: the website on Vercel at tutor.nidanos.com, the API and its queue on Render in Singapore, the database on Supabase in Mumbai, so data is stored in India. Nightly encrypted backups go to our own server |
| 3:45 | Chapter 3 (design) | About 80 tables, 33 API endpoints, every module owning its own tables. Code runs in a fresh, offline sandbox per submission, and our own judge gives the verdict, not the AI |
| 4:30 | Table 8, the CI run | 254 automated tests on a fresh database on every push. All 483 exercises proven in the real sandbox; all 711 possible beginner knowledge states placed exactly by the placement test |

### Part B: live demo (7 min)

| Time | Show | Say |
|---|---|---|
| 5:00 | `tutor.nidanos.com` (Aditi) | The landing page. "Learn to code with AI. Then without it." is the whole idea |
| 5:30 | Get Started, sign-up with a date of birth 15 years ago | Refused: the pilot is adults only, because a child needs a parent's approval first (DPDP Act, section 9), and that flow comes later |
| 6:00 | The consent boxes; then `/privacy` | Consent is per purpose and recorded with the policy version. AI training and research are separate, off by default, adults only. The published policy is built from the same file learners accept |
| 6:30 | Log in as the demo learner (Aman) | The dashboard: the next step chosen by the recommender, progress from the server, the study session |
| 7:15 | "Take the placement test" | Pick the course, answer one question, then "I don't know". The test is adaptive: a beginner finishes in one question, an expert answers about 26 instead of 40. The results show reading and writing apart |
| 8:30 | Dashboard, then Account (Ashwani) | The learner's data rights: correct the profile, switch research on or off, download everything we hold, delete the account with a 7-day grace period |
| 9:30 | Download my data, then `/privacy/providers` | One file with every module's rows and who it was shared with. The providers page and that file are built from the same list, so they can't disagree |

### Part C: the exercise loop, through the API (3 min)

The exercise screen is being built for the pilot; the loop behind it already runs live. In the terminal, press Enter once per step:

1. *Placement and what next:* fixed rules choose the skill, the level (rung 1 to 5) and the exercise, and every choice is saved with its reasons.
2. *Open an exercise:* only the sample test is shown; hidden tests never leave the server.
3. *Wrong answer:* a fresh, offline sandbox per submission (clang 19, about 6 seconds). The verdict shows which tests failed and the sample's expected output.
4. *Hint:* one level per request, never the answer before level 5. Until AI billing starts on 7 November this is a general nudge; after that a filter blocks any hint that looks like the solution.
5. *Correct answer:* the writing score moves 0 → 0.20 by the approved formula (0.4 × rung 3/5 × 0.85, because one hint was used). Reading doesn't move: predicting output and writing code are separate skills.
6. *Download and delete:* the same rights as the Account page, ending with the deletion booked.

### Part D: status and plan (1 min)

| Done and live | Left before the pilot (8–10 Nov) |
|---|---|
| Backend and data (all 13 modules), hosting, backups, 207 lessons, 483 exercises, landing, sign-up, dashboard, placement test, account, legal and providers pages | Exercise, progress and lesson screens (team, in progress); AI billing and stored hints (7 Nov); the pilot with adult learners and the anonymous survey; then the results chapter of the final report |

## Likely questions

| Question | Answer |
|---|---|
| Why two scores instead of one? | Learner A shows why: 10/11 reading, 0/4 writing. Averaging hides exactly the gap we want to close. Each exercise type feeds only the skill it measures |
| How does the AI avoid just giving answers? | Hints climb a 5-level ladder, one level per request, and level 5 is the only one allowed to show code. A leak filter compares each hint with the reference solution and blocks it if it contains the solution or its key lines; the learner's own code doesn't count against it. The number of hints allowed shrinks as the skill's fade stage advances |
| Why not let the AI grade the code? | Grading must be repeatable and fair. Code runs against fixed tests in a sandbox and our own judge decides: accepted, wrong answer, compile error, runtime error, time or memory limit |
| Is running learners' code safe? | Each submission gets a fresh E2B sandbox with the internet off, time and memory limits, and no name or email. It is thrown away afterwards |
| How does the mastery score work? | Each graded attempt moves the score by a fixed formula (version 1, the approved formula): harder rungs count more, every hint used lowers the credit, and the effective score decays with time, so skills come back for review. The tests pin the approved journey 0 → 0.16 → 0.33 → 0.53 → 0.72 |
| How is the placement test adaptive? | Reading questions walk the skill graph easiest-first, skipping what a miss rules out. A typed wrong answer is only a suspected slip until a dependent skill is answered. Code tasks are asked only at the edge of what the learner read correctly, and one accepted task vouches for everything below it. We tested every one of the 711 possible beginner knowledge states |
| How do you protect learners' data? | Data minimisation (the sandbox and the AI never get a name or email), consent per purpose, adults only for now, data stored in India, a public provider list, and every DPDP right built into the Account page |
| Why Vercel, Render and Supabase? | All free for the pilot, the database in India, and no server of our own to keep running. Oracle Cloud was the first plan but had no capacity in Mumbai in 63 attempts (ADR-0024) |
| What does it cost to run? | ₹0 for hosting. A code run costs about ₹0.01 in sandbox time; AI hints start on a paid, no-training plan from 7 November |
| How do you know it works? | 254 automated tests on a fresh database on every push; every exercise proven in the real sandbox before learners see it; the live smoke test returns all six verdicts |
| What isn't done yet? | The exercise, progress and lesson screens, live AI hints, and the pilot itself. The results chapter depends on the pilot data and survey |
| Who did what? | Ashwani: backend, data model, sandbox, deployment, data protection. Aman: placement test and dashboard screens. Aditi: landing page, sign-up and login design, and the legal pages as Grievance Officer |

## If something goes wrong

| Problem | Do this |
|---|---|
| The site or API is slow to answer | Render was asleep: wait about a minute, or open `/health` again |
| `demo:walk` says "No verdict after a minute" | Switch to the hotspot and run it again. If still down, show report A-10 (a recorded run) and the smoke-test result |
| `429` on login or sign-up | Too many tries from the room's address: use the demo learner created the day before |
| A hint says "generic" | Expected: live AI starts with billing on 7 November |
| Wi-Fi fails completely | Report A-9 and A-10 (sample inputs and outputs) and the screenshots PDF |
