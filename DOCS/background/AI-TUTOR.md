# AI Tutor — Project Definition

**Status:** idea → definition **Author:** Ashwani Puri **Date:** 7 Aug 2026 **Audience for this doc:** mentor / peer review.

---

## 1. One-liner

> AI Tutor is a personal learning coach that tracks what you _actually_ know — not what you've watched — adapts every next step to your real gaps, and deliberately withdraws its own help until you don't need it.

The last clause is the differentiator. Say it out loud.

---

## 2. The problem

### The observation this comes from

I am the user. This project exists because of my own last six weeks of learning Angular and React, and I can describe the failure modes precisely — which most people pitching an ed-tech product cannot.

**Failure 1 — Tutorial hell / the illusion of competence.** I could read a 12-hour course and follow every line. Then I sat in front of an empty file and produced nothing. Watching is a _recognition_ task; building is a _recall and construction_ task. Video courses train the first and silently fail at the second. You feel like you're learning right up until the moment you're asked to do something.

**Failure 2 — Courses are linear; learners are not.** A course is a fixed sequence built for a median student who doesn't exist. I already knew closures; I did not know async at all. The course made me sit through both at the same pace. Every hour spent on something I know is an hour stolen from the thing I don't.

**Failure 3 — No model of what you know.** Nothing tracks it. Not the course platform, not the video sites, not me. "How much React do you know?" has no answer more precise than a shrug. Without a model of current state you cannot choose a good next step — you're just picking the next video.

**Failure 4 — AI made this worse.** Ask ChatGPT to explain something and it explains it. Ask it for the code and it writes the code. You feel productive. You learn nothing, because the struggle _is_ the learning — the effortful retrieval is what builds the memory. Current AI tutors optimise for the feeling of progress and against actual progress. They are engineered to create dependency.

**Failure 5 — Nothing survives the day you stop.** Learn something in week 1, never revisit it, it's gone by week 5. No system schedules the revisit.

### The core insight (this is the pitch)

> Every AI tutor on the market is optimised to be maximally helpful in each individual moment. That is exactly the wrong objective. Learning requires **desirable difficulty** — the student must struggle at the edge of their ability. A tutor that removes the struggle removes the learning.

AI Tutor optimises for a different thing: **the student's independent capability over time.** Which sometimes means refusing to answer.

Concretely, the product enforces three rules the competition cannot copy without abandoning their own engagement metrics:

1. **Never gives the code.** It gives a nudge, then a smaller nudge, then a question. Answers are the last resort, and the system logs when it had to give one — that's a signal the step was too big.
2. **Support fades on a schedule.** Week 1 you get worked examples. Week 3 you get the skeleton. Week 5 you get a blank file and a spec. The fade is planned, not reactive.
3. **It tracks what you can do, not what you've seen.** Mastery only moves on evidence — a solved exercise, a passing test, a correct prediction — never on a completed video.

**Position it as: "an AI tutor whose goal is to make itself unnecessary."** That single line does more work than any feature list.

---

## 3. Who it's for

| Persona                  | Situation                                               | Pain                                                                          | What they need                                                          |
| ------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Me (primary)**         | Working dev, learning a stack under time pressure, ADHD | Freeze on blank pages; can read code, can't write it; forgets week-1 material | ~10-min steps, never a blank page, forced retrieval, scheduled revisits |
| **The career switcher**  | Non-CS background, self-teaching                        | No idea what to learn next or whether they're ready                           | A path and an honest readiness signal                                   |
| **The plateaued junior** | 1–2 yrs in, stuck                                       | Knows enough to work, not enough to grow; gaps are invisible to them          | Diagnostic that finds the unknown unknowns                              |
| **The bootcamp grad**    | Finished a course, can't pass interviews                | Recognition without recall                                                    | Retrieval practice against real problems                                |

**Start with:** me, then people exactly like me. If I'm not using it daily by week 6, the project is wrong.

---

## 4. Why now

- LLMs can generate _personalised_ exercises at the right difficulty on demand — the thing that made 1-on-1 tutoring expensive and unscalable.
- Code can be executed and graded automatically in a sandbox, so "did you actually solve it" is a machine-checkable question for programming specifically.
- The research is settled and mostly ignored by products: spaced repetition, retrieval practice, worked-example effect, desirable difficulty. Everyone knows this works. Almost nobody builds it, because it feels worse to use in the short term.
- The AI-dependency problem is now visible enough that "a tutor that won't give you the answer" reads as a feature, not a bug.

---

## 5. Features

### Phase 0 — The core loop (the only thing that matters at first)

| #   | Feature                                                                                                  | Why it's in v1                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| T1  | **Skill graph** for one domain (JS → React) — nodes with prerequisites                                   | Everything else is a query over this. Can't adapt without a map.                                               |
| T2  | **Diagnostic** — short adaptive quiz that places you in the graph                                        | Solves failure 2 and 3. Never start a learner at zero when they aren't.                                        |
| T3  | **Mastery model** — per-node confidence score updated only by evidence                                   | The heart of it. Separately tracks _can read_ vs _can write_, because those diverge hard (mine: 10/11 vs 0/4). |
| T4  | **Exercise ladder** — 5 stages: predict output → fix the bug → fill the blank → extend → build from spec | Solves the blank-page freeze. Difficulty is a dial, not a cliff.                                               |
| T5  | **Sandboxed execution + auto-grading**                                                                   | "Did you solve it" must be objective, not the LLM's opinion.                                                   |
| T6  | **Socratic response engine** with hard refusal on writing solution code                                  | The differentiator, enforced in code.                                                                          |
| T7  | **Next-step recommender** — one button: "what now?"                                                      | ADHD-critical. Decision fatigue kills sessions before they start.                                              |

**Phase 0 ships when:** I open it, hit "next", get a 10-minute step at the right difficulty, and finish it. That's the whole MVP.

### Phase 1 — Retention &amp; honesty

- T8 — Spaced repetition scheduler; mastery **decays** over time and resurfaces
- T9 — Session memory: "last time you struggled with X" carries forward
- T10 — Progress view that shows the graph, coloured by real mastery — with honest red areas
- T11 — Struggle detection: 3 failed attempts → drop a rung on the ladder automatically
- T12 — Configurable scaffolding fade schedule

### Phase 2 — Real-world work

- T13 — Project mode: a multi-session build broken into ~10-min steps, each ending in something visible
- T14 — Code review mode: paste your code → nudges, never rewrites
- T15 — Bring your own material: point at docs/a repo/a course → generates exercises from it (RAG)
- T16 — Interview readiness: mastery graph → honest "you're ready for X, not Y"

### Phase 3 — Scale &amp; moat

- T17 — Multi-domain graphs (Node, Postgres, system design)
- T18 — Community-authored skill graphs
- T19 — Cohort mode: same path, shared progress, light accountability
- T20 — Effectiveness data: which exercise sequences actually produce mastery → improve generation

### Future / ambitious (say, don't build)

- Voice sessions — explain a concept out loud, get graded on the explanation (the Feynman test; strongest known mastery signal)
- Watches you code in your editor and intervenes only when you're genuinely stuck
- Employer-facing verified mastery profile — a credential backed by evidence, not a certificate for watching videos
- Learner-model portability across tools

---

## 6. System design

### 6.1 High-level architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Next.js web app                        │
│  session view · code editor · graph view · diagnostic     │
└───────────────────────┬───────────────────────────────────┘
                        │  REST / streaming
┌───────────────────────▼───────────────────────────────────┐
│                 API LAYER (Node + Express)                │
│         auth · session orchestration · rate limits        │
└──┬──────────┬────────────┬────────────┬───────────────────┘
   │          │            │            │
┌──▼──────┐ ┌─▼─────────┐ ┌▼──────────┐ ┌▼──────────────────┐
│ Learner │ │ Curriculum│ │ Exercise  │ │  Tutor            │
│ model   │ │ / planner │ │ generator │ │  (Socratic)       │
│         │ │           │ │           │ │                   │
│ mastery │ │ graph +   │ │ LLM +     │ │ hint ladder,      │
│ update, │ │ prereqs → │ │ template  │ │ refusal guard,    │
│ decay,  │ │ next node │ │ bank      │ │ struggle detect   │
│ SR queue│ │           │ │           │ │                   │
└──┬──────┘ └─┬─────────┘ └┬──────────┘ └┬──────────────────┘
   │          │            │             │
   │          │      ┌─────▼─────────────▼──┐
   │          │      │   EXECUTION SANDBOX   │
   │          │      │  isolated container,  │
   │          │      │  no net, CPU/mem cap, │
   │          │      │  runs tests → verdict │
   │          │      └───────────────────────┘
┌──▼──────────▼─────────────────────────────────────────────┐
│  PostgreSQL (+pgvector)   │   Redis    │   Object store    │
│  skills, mastery, attempts│  sessions, │  exercise assets, │
│  exercises, sessions      │  SR queue  │  user snapshots   │
└───────────────────────────────────────────────────────────┘

```

### 6.2 The learner model (explain this part in detail — it's the real engineering)

Everything hangs off one question: **what does this person know right now?**

Represent it as a **skill graph**, not a linear course:

```
skills(id, name, domain, difficulty, prerequisite_ids[])

```

Per user, per skill, store **two** numbers plus decay:

```
mastery(user_id, skill_id,
        read_score,      -- can they follow code that uses it
        write_score,     -- can they produce it from scratch
        last_evidence_at,
        attempts, successes)

```

**Why two scores:** my own diagnostic was 10/11 reading, 0/4 writing. One number would have shown ~65% and picked completely the wrong next step. This split is the single most useful design decision in the project and it's the thing to point at when asked "what's actually novel here?"

**Updating:** Bayesian-ish. Each attempt is evidence with a weight based on exercise difficulty, hint count, and time taken.

```
solved with no hints on a hard exercise  → large increase
solved after 3 hints                     → small increase
failed                                   → small decrease + flag the prerequisite

```

Never update from "marked as read" or "watched." Evidence only.

**Decay:** `effective_mastery = score * exp(-λ * days_since_evidence)`, λ per skill (syntax decays fast, concepts slow). When effective mastery crosses a threshold, the skill enters the spaced-repetition queue. This is failure 5 solved in one line of maths.

### 6.3 Next-step selection

Deterministic, not an LLM decision. The LLM is bad at this and it needs to be explainable and cheap:

```
candidates = skills where all prerequisites have effective_mastery > 0.7
           ∪ skills in the spaced-repetition queue (due for review)
score each by:  prerequisite_readiness
              × goal_relevance (distance to the user's stated target)
              × urgency (decay-driven)
              × novelty (don't repeat the last 3)
pick top 1  →  choose exercise rung from the ladder based on write_score

```

The LLM generates the _content_ of the step. The system decides _which_ step. Keep that boundary — it's what makes the product debuggable.

### 6.4 The exercise ladder

Difficulty is a dial with five detents. The learner model picks the rung.

| Rung | Form                                            | Cognitive demand            | Used when                              |
| ---- | ----------------------------------------------- | --------------------------- | -------------------------------------- |
| 1    | **Predict** — here's code, what does it output? | recognition                 | brand new skill                        |
| 2    | **Diagnose** — this is broken, find why         | analysis                    | read_score rising, write_score at zero |
| 3    | **Complete** — working file, 1–3 blanks         | guided production           | first production attempt               |
| 4    | **Extend** — working feature, add the next one  | production with scaffolding | write_score mid                        |
| 5    | **Build** — spec + empty file + tests           | full recall                 | write_score high                       |

**Never a blank page below rung 5.** That rule exists because the blank page is where I froze, and freezing ends a session — and the session ending is the only true failure mode.

### 6.5 The Socratic engine (and how to actually enforce it)

The refusal cannot live in the prompt. Prompts leak. Enforce structurally:

1. **Hint ladder** — the tutor may only emit hints of escalating specificity, and the current allowed level is a **server-side variable**, incremented only by an explicit user request. The model is given one level, never the full ladder.

```
L1  point at the concept        "what happens to `this` inside a callback?"
L2  point at the location       "look at line 14"
L3  name the mechanism          "arrow functions don't rebind `this`"
L4  worked analogous example    (different problem, same shape)
L5  the answer + why            (logged as a system failure)

```

1. **Output filter** — responses are scanned for solution-shaped code blocks matching the current exercise's target. Blocked before they reach the client. Belt and braces, but this is the whole product promise.
2. **L5 is telemetry.** Every time the ladder bottoms out, that's data saying the step was too large. Feed it back into difficulty calibration.

Two-model split for cost: a small fast model handles hints and grading; a larger one handles exercise generation and explanations. Most turns are hints, so most turns are cheap.

### 6.6 Exercise generation — the trust problem

Generated exercises are only useful if they're **correct**. An exercise with a broken starter file destroys trust instantly, and trust is the entire relationship.

Pipeline:

```
skill + rung + user context
  → LLM generates { prompt, starter_code, solution, tests }
  → RUN the tests against the solution in the sandbox
      ├─ solution passes → keep
      └─ fails → regenerate (max 2), else fall back to the template bank
  → cache by (skill, rung, seed) — reuse across users

```

**Never ship a generated exercise that hasn't been executed.** Self-verification through the sandbox is what makes generation viable at all.

Keep a hand-written template bank for the top ~50 skills as the fallback and as the quality benchmark.

### 6.7 Data model sketch

```
skills          (id, name, domain, difficulty, prereq_ids[])
users           (id, goal, target_role, pace_config, fade_schedule)
mastery         (user_id, skill_id, read_score, write_score, last_evidence_at, decay_lambda)
exercises       (id, skill_id, rung, prompt, starter_code, solution, tests, source: gen|bank)
attempts        (user_id, exercise_id, submitted_code, verdict, hints_used, duration_ms, at)
sessions        (user_id, started_at, steps_json, ended_at)
review_queue    (user_id, skill_id, due_at, interval, ease)
concepts        (skill_id, explanation_md, embedding)   -- for RAG + BYO material

```

`attempts` is the most valuable table in the system. It's the mastery evidence, the difficulty calibration data, and eventually the effectiveness dataset (§ T20). Log everything.

### 6.8 The sandbox (the one real ops risk)

Running user code is the piece where you can actually get hurt.

- Isolated container per execution, **no network**, read-only FS except /tmp
- Hard caps: 5s CPU, 256MB, no child processes
- Non-root, dropped capabilities, seccomp
- Queue-backed, rate-limited per user
- Start with a managed runner (Judge0, E2B, Piston) — **do not hand-roll this in v1.** Say that in the presentation; knowing when not to build something is a senior signal.

### 6.9 Stack + why

| Layer    | Choice                        | Reason                                                                           |
| -------- | ----------------------------- | -------------------------------------------------------------------------------- |
| Frontend | **Next.js** + Monaco editor   | Editor in the browser; SSR for public concept pages                              |
| API      | **Node + Express + TS**       | Same language as the code being taught — the sandbox and the app share a runtime |
| DB       | **PostgreSQL + pgvector**     | Relational graph queries _and_ embeddings in one place                           |
| Queue    | Redis + BullMQ                | Sandbox runs, generation, SR scheduling                                          |
| Sandbox  | Managed runner first          | Security is not where I want to be original                                      |
| LLM      | Two-tier behind one interface | Cost; hints are cheap, generation isn't                                          |
| Deploy   | Vercel + Fly/Railway          | Ship fast, scale later                                                           |

---

## 7. Phases &amp; scope

| Phase                       | Goal                                        | Done when                                                          | Rough effort       |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------ | ------------------ |
| **P0 — Paper spike**        | Prove the loop works _without software_     | I run the ladder manually for 2 weeks and it beats how I learn now | 2 weeks, zero code |
| **P1 — Core loop**          | T1–T7, one domain (JS→React), one user (me) | I press "next", get a good step, finish it. Daily, for 2 weeks.    | 8–10 weeks         |
| **P2 — Retention**          | T8–T12                                      | Week-4 material resurfaces and I still know it                     | 4–6 weeks          |
| **P3 — Projects &amp; BYO** | T13–T16                                     | Someone who isn't me completes a 5-session project                 | 6–8 weeks          |
| **P4 — Scale**              | T17–T20                                     | Second domain added without touching engine code                   | open-ended         |

**P0 is not optional and it's the smartest thing in this plan.** The core hypothesis — "adaptive laddered steps with fading support beat a course" — is testable with a notebook and a timer. If it fails on paper it fails in software, and you'll have found out in two weeks instead of six months. Mentors notice when someone proposes to test the hypothesis before building the machine.

### Explicitly out of scope

- ✗ Video content. Text + code + exercises only.
- ✗ Multiple languages/domains in v1. One graph, done well.
- ✗ Mobile app. (Mobile-_readable_ progress view is fine.)
- ✗ Social features, leaderboards, streak gamification — extrinsic motivation crowds out the intrinsic kind, and streaks punish exactly the people who need this most.
- ✗ Certificates. The mastery graph _is_ the credential.
- ✗ Payments until P3.
- ✗ Training a custom model.
- ✗ Building my own sandbox in v1.

---

## 8. Risks &amp; hard parts

| Risk                                               | Severity | Mitigation                                                                                                                                                                   |
| -------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The skill graph is a huge manual authoring job** | High     | Start with ~60 nodes for JS→React, hand-authored. Do not try to generate the graph; it's the spine and it must be right.                                                     |
| **Users hate being refused an answer**             | High     | This is the central product risk. Mitigate with _fast, good_ hints and visible progress — and accept that this product is not for everyone. Measure hint-ladder abandonment. |
| **Generated exercises are wrong**                  | High     | §6.6 — execute before serving. Non-negotiable.                                                                                                                               |
| **Mastery scores don't reflect reality**           | High     | Validate against periodic held-out challenges. If the model says 0.8 and they fail, the model is wrong — track that error rate as a first-class metric.                      |
| **Sandbox security**                               | High     | Managed runner. Don't be clever.                                                                                                                                             |
| **Cost per session**                               | Medium   | Small model for hints (most turns); cache generated exercises across users.                                                                                                  |
| **It's a tool for one person (me)**                | Medium   | Real risk, and worth naming honestly. P3's "someone who isn't me" gate is the test.                                                                                          |
| **Scope creep into "a course platform"**           | Certain  | The out-of-scope list. The moment it has video, it's a different product with 50 competitors.                                                                                |

**The hardest problem** is not generation and not the sandbox. It's **calibration** — knowing that someone has actually learned something, from noisy evidence, in a way you can defend. That's where the intellectual work is, and saying so demonstrates you understand your own project.

---

## 9. Success metrics

- **P0:** manual loop beats self-study on a fair comparison (same 2 weeks, honest self-assessment)
- **P1:** I use it ≥ 5 days/week for 3 weeks; median session ends _completed_, not abandoned
- **P2:** ≥ 70% recall on skills learned 4 weeks earlier
- **P3:** hints-per-exercise trends **down** for a fixed difficulty — the actual proof of learning
- **Anti-metric:** time-in-app. Deliberately not optimised. If people finish faster, it's working. Have this line ready — it's the cleanest expression of the whole thesis.

---

## 10. Questions your mentor will ask

1. **"Isn't this just Duolingo for code?"** → Duolingo teaches recognition and optimises for streaks. This tracks read vs. write separately, executes your code, and refuses to give you answers. Opposite objective function.
2. **"Why won't people just use ChatGPT?"** → They will, and they'll feel like they're learning while not learning. That's the whole premise. This product's value is only visible in the outcome, which is a genuinely hard sell — I know that.
3. **"How do you know someone has learned something?"** → You don't, directly. You infer it from evidence — solved exercises weighted by difficulty and hints — and you validate the inference against held-out challenges. §6.2, and the error rate is a tracked metric.
4. **"Who authors the curriculum?"** → Me, for v1, ~60 nodes. It's real work and it's the moat, not a chore to automate away.
5. **"Isn't the market full of AI tutors?"** → It's full of AI _answerers_. Nobody is optimising for withdrawal of support, because it hurts engagement metrics. That's the opening.
6. **"You're a junior dev — can you build this?"** → P0 needs no code. P1 is a CRUD app over Postgres with LLM calls and a managed sandbox. The hard part is design judgement, not exotic engineering.
7. **"Isn't this just what your AI mentor is already doing with you?"** → Yes. That's the strongest argument for it, not against — I'm productising a process I've run on myself and can describe the failure modes of from the inside.

---

## 11. What I'd say if I had 60 seconds

> I spent six weeks learning React from a 12-hour video course. I could follow every line. Then I opened an empty file and couldn't write anything. That gap — between recognising code and producing it — is what every learning product ignores, because watching feels like progress.

> AI made it worse. Ask an AI tutor a question and it gives you the answer. You feel productive and learn nothing, because the struggle is the learning.

> AI Tutor tracks two separate scores per skill — can you read it, can you write it — and only updates them on evidence: code you actually ran and passed. It picks your next step from a prerequisite graph, sets the difficulty on a five-rung ladder so you're never staring at a blank page, and gives hints that escalate only when you ask — never the solution.

> The goal isn't engagement. It's for you to stop needing it. I'm testing the whole loop on paper for two weeks before I write a line of code.

---

## 12. Open questions (bring these)

- Do people actually _want_ to be refused? Or does the market only reward the thing that feels good? Test with 5 people before P1.
- One deep domain vs. broad shallow coverage — deep is better product, narrower market.
- Consumer subscription, or B2B to bootcamps/companies who care about outcomes rather than feelings? The B2B buyer's incentives align much better with the anti-engagement design.
- Does this get eaten when the big labs ship "study mode"? What's actually defensible — probably the learner model and the exercise-effectiveness data, not the prompts.

---

## 13. Relationship to Job AI

Not accidental. Both are the same architecture applied to different domains:

|                   | Job AI                   | AI Tutor                           |
| ----------------- | ------------------------ | ---------------------------------- |
| Model an entity   | candidate profile        | learner mastery                    |
| Model a target    | job requirements         | skill graph node                   |
| Explainable gap   | "you're missing K8s"     | "your write_score on hooks is 0.3" |
| Actionable output | tailored CV / gap report | the next exercise                  |
| Feedback loop     | outcome data             | attempt data                       |

**Job AI tells you what you're missing. AI Tutor teaches it to you.** They're two halves of one thesis, and shared infrastructure (structured extraction, evidence-based scoring, gap analysis) means building one makes the other cheaper.

Worth mentioning at the end of the presentation — it makes two ideas look like one coherent direction rather than scattered enthusiasm. But **do not build them at the same time.**
