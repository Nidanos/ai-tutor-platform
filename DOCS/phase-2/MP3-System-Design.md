# AI Tutor: System Design (Phase 2)

**AI Tutor: An Evidence-Based Adaptive Learning System with Deliberate Scaffolding Withdrawal**

|           |                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course    | MCA-269 Minor Project III                                                                                                                            |
| Phase     | 2: System design (DFD, ER, UML) and partial implementation                                                                                           |
| Date      | 15 Oct 2026                                                                                                                                          |
| Team      | Ashwani Kumar Puri (04914004425): backend, architecture, database · Aman Dogra (01614004425): frontend · Aditi Tanwar (01814004425): frontend, UI/UX |
| Guide     | _to be filled_                                                                                                                                       |
| Builds on | Phase 1 SRS (`../phase-1-submitted/MP3-SRS.pdf`), API spec (`../spec/`), ADRs (`../adr/`)                                                            |

## Contents

1. [Scope of this document](#1-scope-of-this-document)
2. [Design decisions](#2-design-decisions)
3. [Architecture](#3-architecture)
4. [Data flow diagrams](#4-data-flow-diagrams)
5. [Database design and ER diagrams](#5-database-design-and-er-diagrams)
6. [UML diagrams](#6-uml-diagrams)
7. [API design](#7-api-design)
8. [Non-functional design](#8-non-functional-design)
9. [Requirement traceability](#9-requirement-traceability)
10. [Partial implementation status](#10-partial-implementation-status)
11. [Open items](#11-open-items)

---

## 1. Scope of this document

This document turns the Phase 1 SRS into a buildable design. It covers the whole system (13 modules, ~98 API operations) so nothing has to be redesigned later. It also marks what is built first: the **MVP due 10 Nov 2026**.

Core idea, unchanged from Phase 1: the system keeps a **separate reading and writing mastery score per skill**, updates it **only from executed code**, and **withdraws help on a schedule** until the learner can work alone.

---

## 2. Design decisions

| Area | Decision | Source |
| --- | --- | --- |
| First course | Data Structures & Algorithms, with a beginner C++ track. More courses (frontend, backend, full stack) follow | ADR-0001, 13 Oct |
| Languages | Engine is language-agnostic. **C++20 (clang 19)** ships first; Java and Python follow | ADR-0002, 13 Oct |
| Skill map and resources | Skills and edges authored by Ashwani. Each skill links to original resources; nothing is copied | ADR-0001, 13 Oct |
| Code execution | E2B sandbox (network off) + our own judge adapter; one sandbox reused per learner session | ADR-0003, 13 Oct |
| Verdicts | AC, WA, CE, RE, TLE, MLE, **SE** (sandbox error: not the learner's fault, no mastery effect) | ADR-0004, 13 Oct |
| Content | LLM-generated, then **verified in the sandbox and frozen**. Grading and next-step selection never use an LLM | ADR-0005 |
| Exercise delivery | Pre-generated in the background; async job with a status endpoint as fallback | 13 Oct |
| Clearing a skill | AC on a rung-5 (Build) exercise of that skill using 0 or 1 hint | 13 Oct |
| Scaffolding fade | **Per skill.** Help on a skill drops one stage each time the learner solves that skill's current rung with 0 or 1 hint | 13 Oct |
| Hint level 5 | Shows the frozen reference solution, logged as a bottom-out, no mastery credit for that attempt | 13 Oct |
| Compile errors | After the 3rd on the same exercise: **offer** a hint, never push one (FR-M8-03 stays intact) | 13 Oct |
| TLE/MLE penalty | Starts at 1/20 of the WA penalty, doubles on each consecutive TLE/MLE, capped at the WA penalty, resets on AC | ADR-0004, 13 Oct |
| Code retention | Learner code is kept until the learner clears that skill, then deleted. Verdicts and test results are kept | 13 Oct |
| Organisations | Kept. Every learner belongs to one (a personal organisation by default) so colleges can be added without schema changes | 13 Oct |
| Admin panel | Cut from the MVP: skill graph is seeded by script; analytics is one admin-only page | 13 Oct |
| Auth | Registration, then a separate first login. 15-minute JWT + 30-day rotating refresh token. httpOnly cookies for web, `Authorization: Bearer` for the planned mobile app. Web reaches the API through a Next.js proxy (same origin, so no CORS). Profile always comes from `GET /auth/me` | 13 Oct |
| Database | PostgreSQL 16 + pgvector, schema and migrations with Drizzle ORM | 13 Oct |
| LLM | Google Gemini behind one adapter (small model for hints, large model for generation) | 13 Oct |
| Queue | Redis + BullMQ, single Redis client (`ioredis`) | 13 Oct |

Each decision is recorded with its reasoning in `../adr/` (ADR-0001 to ADR-0009, updated 13 Oct).

---

## 3. Architecture

```mermaid
flowchart LR
  B["Browser: Next.js + Monaco editor"]
  MOB["Mobile app (next year)"]
  API["API: Express 5"]
  PG[("Postgres + pgvector")]
  RD[("Redis: job queue, rate limits")]
  WK["Worker: background jobs"]
  E2B["E2B sandbox, network off"]
  GEM["Gemini"]
  B -->|HTTPS JSON| API
  MOB -.->|HTTPS JSON| API
  API --> PG
  API -->|add job| RD
  RD -->|take job| WK
  WK --> PG
  WK -->|compile and run code| E2B
  WK -->|generate exercises| GEM
  API -->|live hints only| GEM
```

| Component | Responsibility |
| --- | --- |
| Web (`apps/web`) | Learner and admin screens, Monaco code editor. Calls `/api/*` on its own origin; Next.js forwards to the API |
| API (`apps/api`) | Auth, validation, all 13 modules, fast reads and writes |
| Worker (`apps/api`, second entry point) | Exercise generation and verification, code execution, scheduled jobs (decay scan, pre-generation, code purge) |
| PostgreSQL | Single source of truth for all data |
| Redis | Job queue (and rate-limit counters once the API runs as several processes). Holds nothing that can't be lost |
| E2B | Runs learner and reference code in isolation |
| Gemini | Generates exercise drafts and live hints. Never grades, never selects |
| `packages/types` | Shared request/response contracts between web and API |

**Rule:** the API answers fast; anything slow (running code, generating exercises) becomes a queued job handled by the worker.

---

## 4. Data flow diagrams

**Notation:** rectangle = external entity · circle = process · cylinder = data store · arrow = data in motion.

### 4.1 Level 0: context diagram

```mermaid
flowchart LR
  L["Learner"]
  AU["Author"]
  AD["Admin"]
  GEM["Gemini LLM"]
  SBX["E2B sandbox"]
  EM["Email service (later)"]
  P0(("0 AI Tutor System"))
  L -->|sign-up, goal, language, answers, code, hint requests| P0
  P0 -->|exercises, verdicts, one hint level, progress, reviews| L
  AU -->|skill graph seed, resources, template exercises| P0
  P0 -->|validation results| AU
  AD -->|fade schedule, report requests| P0
  P0 -->|calibration and usage reports| AD
  P0 -->|generation and hint prompts| GEM
  GEM -->|JSON exercise drafts, hint text| P0
  P0 -->|code, harness, limits| SBX
  SBX -->|compiler output, exit codes, time, memory| P0
  P0 -.->|reset links| EM
```

### 4.2 Level 1: the 13 processes

```mermaid
flowchart LR
  L["Learner"]
  AU["Author"]
  AD["Admin"]
  GEM["Gemini"]
  SBX["E2B"]
  P1(("1 Manage accounts"))
  P2(("2 Manage skill graph"))
  P3(("3 Run diagnostic"))
  P4(("4 Update mastery"))
  P5(("5 Recommend next step"))
  P6(("6 Generate and verify exercises"))
  P7(("7 Execute and grade"))
  P8(("8 Give hints"))
  P9(("9 Run session"))
  P10(("10 Schedule reviews"))
  P11(("11 Show progress"))
  P12(("12 Control fade"))
  P13(("13 Analyse and calibrate"))
  D1[("D1 Accounts")]
  D2[("D2 Skill graph")]
  D3[("D3 Diagnostics")]
  D4[("D4 Mastery and evidence")]
  D5[("D5 Exercises")]
  D6[("D6 Attempts and submissions")]
  D7[("D7 Hint log")]
  D8[("D8 Sessions")]
  D9[("D9 Review queue")]
  D10[("D10 Fade state per skill")]
  D11[("D11 Analytics and logs")]
  L -->|sign-up, login| P1
  P1 --> D1
  AU -->|skills, edges, resources| P2
  P2 --> D2
  L -->|answers| P3
  P3 --> D3
  P3 -->|initial scores| P4
  P4 --> D4
  P4 -->|below threshold| P10
  P10 --> D9
  D2 --> P5
  D4 --> P5
  D9 --> P5
  D10 --> P5
  P5 -->|skill and rung| P9
  P9 --> D8
  P9 -->|current step| L
  P5 -->|need exercise| P6
  P6 -->|prompt| GEM
  GEM -->|draft| P6
  P6 -->|test runs| SBX
  P6 --> D5
  L -->|code| P7
  D5 -->|harness, tests, limits| P7
  P7 -->|code, limits| SBX
  SBX -->|results| P7
  P7 --> D6
  P7 -->|evidence| P4
  P7 -->|verdict| L
  L -->|hint request| P8
  D10 -->|ceiling| P8
  P8 -->|prompt| GEM
  P8 --> D7
  P8 -->|one level| L
  P7 -->|AC, rung, hints used| P12
  AD -->|schedule| P12
  P12 --> D10
  D2 --> P11
  D4 --> P11
  P11 -->|progress view| L
  D4 --> P13
  D6 --> P13
  D7 --> P13
  P13 --> D11
  P13 -->|reports| AD
```

**What the diagram guarantees:**

- **Only process 4 writes mastery (D4).** Evidence comes only from the diagnostic (3) and graded code (7). Reading resources or watching never changes mastery (FR-M4-02).
- **Process 5 has no flow to Gemini.** The next step is chosen by rules (FR-M5-04).
- **Process 8 reads the ceiling from D10** before giving any hint (FR-M12-02). Process 12 moves a skill's fade stage when grading reports a solve with 0 or 1 hint.

### 4.3 Level 2: process 7, Execute and grade

```mermaid
flowchart LR
  L["Learner"]
  SBX["E2B"]
  P71(("7.1 Accept submission"))
  P72(("7.2 Queue job"))
  P73(("7.3 Compile and run"))
  P74(("7.4 Classify verdict"))
  P75(("7.5 Apply evidence policy"))
  P76(("7.6 Report result"))
  P4(("4 Update mastery"))
  P12(("12 Control fade"))
  Q[("Q1 Job queue")]
  D5[("D5 Exercises")]
  D6[("D6 Attempts and submissions")]
  L -->|code| P71
  P71 --> D6
  P71 --> P72
  P72 --> Q
  Q --> P73
  D5 -->|harness, tests, limits| P73
  P73 -->|files, limits| SBX
  SBX -->|exit code, time, memory, output| P73
  P73 --> P74
  P74 -->|verdict, per-test results| D6
  P74 -->|AC WA RE TLE MLE, CE from the 3rd| P75
  P75 -->|weighted evidence| P4
  P75 -->|AC with rung and hints used| P12
  D6 --> P76
  P76 -->|verdict, visible tests only| L
```

- The harness and hidden tests go to the sandbox only, never to the learner.
- A sandbox error (SE) stops at 7.4 and sends no evidence (NFR-R2).

### 4.4 Level 2: process 6, Generate and verify exercises

```mermaid
flowchart LR
  T["Trigger: recommender or pre-gen schedule"]
  GEM["Gemini"]
  SBX["E2B"]
  P61(("6.1 Check content key"))
  P62(("6.2 Draft with Gemini"))
  P63(("6.3 Validate JSON"))
  P64(("6.4 Run reference, set time limit"))
  P65(("6.5 Mutation check"))
  P66(("6.6 Freeze and make hints"))
  P67(("6.7 Fall back to template"))
  D5[("D5 Exercises")]
  D11[("D11 Generation failures")]
  T --> P61
  D5 -->|frozen one exists?| P61
  P61 -->|missing| P62
  P62 -->|prompt| GEM
  GEM -->|JSON draft| P62
  P62 --> P63
  P63 --> P64
  P64 -->|reference code| SBX
  P64 --> P65
  P65 -->|brute force code| SBX
  P65 --> P66
  P66 --> D5
  P63 -->|invalid| D11
  P64 -->|reference fails| D11
  P65 -->|tests too weak| D11
  P65 -->|retry, bigger n, max 2| P62
  P65 -->|3rd failure| P67
  D5 -->|template| P67
```

- **Time limit** = 3 × the slowest of several reference runs, never below a measured floor.
- **Mutation check:** a deliberately slow brute-force solution must **pass the small tests** and **time out on the large tests**. This proves the tests can tell an efficient solution from a slow one (FR-M7-03).
- After 3 failed tries the learner gets a hand-written template exercise, with no error shown (NFR-R1).

---

## 5. Database design and ER diagrams

### 5.1 Design rules

| Rule | Meaning | Why |
| --- | --- | --- |
| Ledger + snapshot | Every mastery change appends a row to `evidence_events` (never edited); `mastery_records` holds current values; both written in one transaction | Full history for the history API, calibration and research |
| Frozen content | A verified exercise is never edited; a change creates a new row with a new `content_version` | Determinism |
| Server-owned state | Hint level, hint ceiling, fade stage, mastery and verdicts exist only in the database | The client can't tamper with them (spec §23) |
| Compute on read | Effective mastery = `score × e^(−λ × days since evidence)` and "review is due" are calculated, not stored | They change every second |
| Idempotent writes | Unique keys stop a retried job double-counting evidence and a double-click submitting twice | Correctness under retries |
| Secrets apart | Solutions, harness and test generators live in `exercise_secrets`, a separate table that public queries never join | A careless query can't leak a solution |
| One writer per state | M4 alone writes mastery; M12 alone writes fade stages | Each rule lives in one place |
| Store each fact once | A value that can be derived (the learner of a recommendation, an evidence row's source, "passed" from a verdict) is not stored again | Duplicates can disagree |
| Scoped rows | Every user has an `org_id`; every content, mastery and fade row has a `language_code` | Institutions and multiple languages without later migrations |

**Conventions**

| Item | Choice | Why |
| --- | --- | --- |
| Names | `snake_case`, plural tables | Postgres convention |
| IDs | UUIDv7 created by the app; `bigint` identity for logs | Time-ordered (index-friendly), known before insert, don't reveal counts |
| Time | `timestamptz`, stored in UTC | One timezone in storage; convert only for display |
| Scores | `double precision`, CHECK 0–1 | Maths runs on JavaScript numbers anyway |
| Money | `numeric(10,4)` | Exact decimals |
| Nulls | NOT NULL by default; null only means "not yet" or "not applicable" | Fewer edge cases |
| User text | `text` with length CHECKs (name ≤ 80, code ≤ 64 KB) | Stops oversized input |
| Fixed sets | Postgres enums | Invalid values rejected |
| Extensions | `citext` (email), `vector` (pgvector, later) | Nothing else needed |
| Constraint names | snake_case; multi-word unique columns are named explicitly | drizzle-kit would otherwise emit camelCase names |

**Delete rules**

| Rule | Used for | Why |
| --- | --- | --- |
| Never delete, change status | users (`disabled`), skills, exercises, courses (`retired`) | Learning history must survive |
| `RESTRICT` (default) | All learning history | The database refuses to orphan history |
| `CASCADE` | Tokens, a run's test results, a course's language list | Meaningless without the parent |
| `SET NULL` | "Who did it" columns (`created_by`, `requested_by`) | Keep the record if that user goes |

### 5.2 Overview: 42 tables in 9 groups

```mermaid
erDiagram
  organizations ||--o{ users : "members"
  users ||--o{ refresh_tokens : ""
  users ||--o{ password_reset_tokens : ""
  users ||--o{ enrollments : ""
  courses ||--o{ enrollments : ""
  courses ||--o{ course_languages : ""
  languages ||--o{ course_languages : ""
  courses ||--o{ skills : ""
  courses ||--o{ skill_graph_changes : ""
  skills ||--o{ skill_prerequisites : ""
  skills ||--o{ skill_resources : ""
  skills ||--o{ concept_chunks : ""
  skills ||--o{ diagnostic_items : ""
  enrollments ||--o{ diagnostic_attempts : ""
  diagnostic_attempts ||--o{ diagnostic_responses : ""
  diagnostic_items ||--o{ diagnostic_responses : ""
  diagnostic_attempts ||--o{ diagnostic_results : ""
  users ||--o{ mastery_records : ""
  skills ||--o{ mastery_records : ""
  users ||--o{ evidence_events : ""
  submissions |o--o{ evidence_events : ""
  users ||--o{ review_items : ""
  skills ||--o{ exercises : ""
  exercises ||--|| exercise_secrets : ""
  exercises ||--o{ exercise_tests : ""
  exercises ||--o{ exercise_hints : ""
  generation_jobs |o--o| exercises : ""
  generation_jobs ||--o{ generation_failures : ""
  users ||--o{ exercise_attempts : ""
  exercises ||--o{ exercise_attempts : ""
  exercise_attempts ||--o{ submissions : ""
  submissions ||--o{ sandbox_runs : ""
  sandbox_runs ||--o{ run_test_results : ""
  exercise_attempts ||--o{ hint_events : ""
  enrollments ||--o{ learning_sessions : ""
  learning_sessions ||--o{ session_steps : ""
  recommendations ||--o| session_steps : ""
  session_steps |o--o| exercise_attempts : ""
  enrollments ||--o{ recommendations : ""
  fade_schedules ||--|{ fade_stages : ""
  users ||--o{ skill_scaffolding : ""
  skills ||--o{ skill_scaffolding : ""
  fade_stages ||--o{ skill_scaffolding : ""
  users ||--o{ fade_stage_changes : ""
  users ||--o{ calibration_records : ""
  users ||--o{ consents : ""
  users |o--o{ audit_log : ""
  llm_calls {
    bigint id PK "no FKs, logs every Gemini call"
  }
```

| Group | Tables | Modules | Built |
| --- | --- | --- | --- |
| Identity and access | organizations, users, refresh_tokens, password_reset_tokens | M1 | Phase 2 (first 3), later |
| Courses and skill graph | languages, courses, course_languages, skills, skill_prerequisites, skill_resources, skill_graph_changes, concept_chunks | M2 | MVP (first 6), later |
| Enrollment and diagnostic | enrollments, diagnostic_items, diagnostic_attempts, diagnostic_responses, diagnostic_results | M1, M3 | MVP |
| Mastery and reviews | mastery_records, evidence_events, review_items | M4, M10 | MVP |
| Exercises and generation | exercises, exercise_secrets, exercise_tests, exercise_hints, generation_jobs, generation_failures | M6 | MVP |
| Attempts and execution | exercise_attempts, submissions, sandbox_runs, run_test_results | M7 | MVP |
| Hints, sessions, recommendations | hint_events, learning_sessions, session_steps, recommendations | M5, M8, M9 | MVP |
| Scaffolding fade | fade_schedules, fade_stages, skill_scaffolding, fade_stage_changes | M12 | MVP |
| Analytics, research, cost | calibration_records, consents, llm_calls, audit_log | M13 | MVP (first 3), later |

### 5.3 Identity and access (M1)

```mermaid
erDiagram
  organizations ||--o{ users : "has members"
  users ||--o{ refresh_tokens : "logs in with"
  users ||--o{ password_reset_tokens : "resets with"
  organizations {
    uuid id PK
    text name
    text slug UK
    enum kind "personal or institution"
    timestamptz created_at
  }
  users {
    uuid id PK
    uuid org_id FK
    citext email UK "login id, case-insensitive"
    text display_name
    enum role "LEARNER AUTHOR ADMIN"
    text password_hash "argon2id, never the password"
    text timezone "default Asia/Kolkata, display only"
    enum status "active or disabled"
    timestamptz email_verified_at
    timestamptz last_login_at
    timestamptz created_at
    timestamptz updated_at
  }
  refresh_tokens {
    uuid id PK
    uuid user_id FK
    uuid family_id "same for every token from one login"
    text token_hash UK "SHA-256, never the token"
    uuid replaced_by_id FK "token that replaced this one"
    enum client "web or mobile"
    text user_agent
    inet ip
    timestamptz expires_at
    timestamptz revoked_at "set on rotation or logout"
    timestamptz created_at
  }
  password_reset_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash UK
    timestamptz expires_at
    timestamptz used_at
  }
```

- **Organisations:** every learner belongs to one. Sign-up creates a hidden personal organisation; a college later becomes an institution organisation. Everything else links through `users`, so this one column is all that institutional licensing needs.
- **Tokens:** login issues a 15-minute JWT (not stored) and a 30-day refresh token (stored only as a hash). Each refresh replaces the token (`replaced_by_id`). If an already-replaced token is reused, every token in its `family_id` is revoked, because reuse means it was copied.
- Sign-up always creates a `LEARNER`. Authors and admins are created by a seed script.

### 5.4 Courses and skill graph (M2)

```mermaid
erDiagram
  courses ||--o{ course_languages : "offered in"
  languages ||--o{ course_languages : "used by"
  courses ||--o{ skills : "contains"
  skills ||--o{ skill_prerequisites : "needs"
  skills ||--o{ skill_prerequisites : "is needed by"
  languages |o--o{ skill_prerequisites : "only on this track"
  skills ||--o{ skill_resources : "learn from"
  courses ||--o{ skill_graph_changes : "history"
  skills ||--o{ concept_chunks : "explained by"
  languages {
    text code PK "cpp java python"
    text display_name
    text toolchain "clang"
    text toolchain_version "19.x, part of content_version"
    text compile_flags
    boolean is_active
  }
  courses {
    uuid id PK
    uuid org_id FK "null means public"
    text slug UK "dsa, cpp-basics"
    text title
    text description
    enum status "draft published retired"
    timestamptz created_at
  }
  course_languages {
    uuid course_id FK
    text language_code FK
    boolean is_default
  }
  skills {
    uuid id PK
    uuid course_id FK
    text slug "unique per course"
    text name
    text description "own words"
    enum skill_type "syntactic or conceptual"
    double decay_lambda "per day"
    smallint difficulty "1 to 5"
    text source_url "source page"
    enum status "active or retired"
    timestamptz updated_at
  }
  skill_prerequisites {
    uuid id PK
    uuid skill_id FK
    uuid prerequisite_id FK
    text language_code FK "null means every track"
    double min_mastery "default 0.7"
    uuid created_by FK
  }
  skill_resources {
    uuid id PK
    uuid skill_id FK
    text language_code FK "null means any language"
    text title
    text url "original source"
    enum kind "article video docs course"
    smallint position
    boolean is_active
  }
  skill_graph_changes {
    uuid id PK
    uuid course_id FK
    uuid actor_id FK
    enum action "skill added, retired, edge added..."
    jsonb payload
    timestamptz created_at
  }
  concept_chunks {
    uuid id PK
    uuid skill_id FK
    text language_code FK
    text body_md
    vector embedding "pgvector"
    text content_version
  }
```

- A **course** is a subject (`dsa`); a **language** is how it is practised. The beginner C++ track is its own course (`cpp-basics`), and DSA skills on the C++ track depend on its skills.
- **The skill map is ours.** Skill names, descriptions and edges are written by us. `skill_resources` link to the original articles and docs as further reading. Reading them never changes mastery (FR-M4-02).
- Prerequisite edges can apply to one language track only (`language_code`) or to all (`null`). A unique key with `NULLS NOT DISTINCT` stops duplicate edges.
- The graph must stay acyclic (FR-M2-02): the service runs a cycle check before inserting an edge; a CHECK constraint blocks self-loops.

### 5.5 Enrollment and diagnostic (M1, M3)

```mermaid
erDiagram
  users ||--o{ enrollments : "enrolls"
  courses ||--o{ enrollments : "in"
  skills |o--o{ enrollments : "goal"
  enrollments ||--o{ diagnostic_attempts : "takes"
  diagnostic_attempts ||--o{ diagnostic_responses : "answers"
  diagnostic_items ||--o{ diagnostic_responses : "asked"
  diagnostic_attempts ||--o{ diagnostic_results : "estimates"
  skills ||--o{ diagnostic_items : "tests"
  enrollments {
    uuid id PK
    uuid user_id FK
    uuid course_id FK
    text language_code FK
    uuid goal_skill_id FK
    text goal_text "FR-M1-03"
    enum status "active paused completed dropped"
    timestamptz started_at
  }
  diagnostic_items {
    uuid id PK
    uuid skill_id FK
    text language_code FK
    enum dimension "reading or writing"
    smallint difficulty
    text prompt_md
    jsonb payload "choices or code"
    jsonb answer_key "SECRET"
    uuid exercise_id FK "writing items run in E2B"
    text content_version
  }
  diagnostic_attempts {
    uuid id PK
    uuid enrollment_id FK
    smallint attempt_no "2 on a retake"
    enum status "in_progress completed abandoned"
    timestamptz started_at
    timestamptz completed_at
  }
  diagnostic_responses {
    uuid id PK
    uuid diagnostic_id FK
    uuid item_id FK
    smallint seq
    jsonb answer
    boolean is_correct "null until graded"
    uuid submission_id FK "writing items"
    int time_taken_ms
  }
  diagnostic_results {
    uuid diagnostic_id FK
    uuid skill_id FK
    double est_reading
    double est_writing
    double confidence
  }
```

- An **enrollment** = user + course + language + goal (one per user, course and language). A composite foreign key to `course_languages` rejects a language the course doesn't offer.
- Writing items are real exercises graded in the sandbox, so starting writing scores also come from executed code. Their submissions do not create evidence directly; `diagnostic_results` seeds the first `mastery_records` once (FR-M3-02).

### 5.6 Mastery and reviews (M4, M10)

```mermaid
erDiagram
  users ||--o{ mastery_records : "has"
  skills ||--o{ mastery_records : "for"
  users ||--o{ evidence_events : "earns"
  submissions |o--o{ evidence_events : "from a graded run"
  diagnostic_attempts |o--o{ evidence_events : "from the diagnostic"
  users ||--o{ review_items : "due"
  skills ||--o{ review_items : "review of"
  mastery_records {
    uuid user_id FK "PK part 1"
    uuid skill_id FK "PK part 2"
    text language_code FK "PK part 3"
    double reading_score "0 to 1"
    double writing_score "0 to 1"
    timestamptz reading_evidence_at
    timestamptz writing_evidence_at
    timestamptz cleared_at "AC on rung 5 with 0 or 1 hint"
    int attempt_count
    int success_count
    double decay_lambda "copied from skill"
    smallint limit_streak "TLE MLE doubling"
    int version "optimistic lock"
    timestamptz updated_at
  }
  evidence_events {
    bigint id PK
    uuid user_id FK
    uuid skill_id FK
    text language_code FK
    enum dimension "reading or writing"
    uuid submission_id FK "set for graded runs"
    uuid diagnostic_id FK "set for diagnostic seeds"
    enum verdict
    smallint rung
    smallint hints_used
    int time_taken_ms
    double weight
    double score_before
    double score_after
    text formula_version
    timestamptz created_at
  }
  review_items {
    uuid id PK
    uuid user_id FK
    uuid skill_id FK
    text language_code FK
    enum status "scheduled completed cancelled"
    enum reason "decay manual failed_prereq"
    timestamptz due_at "due when this has passed"
    double interval_days
    double ease
    timestamptz completed_at
  }
```

- One mastery row per user, skill and language, keyed by those three columns (nothing refers to it by ID). Reading and writing are never combined (FR-M11-02), and each decays from its own last evidence.
- `cleared_at` is set the first time the learner gets AC on a rung-5 exercise of the skill using 0 or 1 hint.
- Each evidence row points to exactly one real source (a submission or a diagnostic), enforced by a CHECK. Which key is set *is* the source, so no separate "source" column is stored. Unique keys on `(submission_id, dimension)` and `(diagnostic_id, skill_id, dimension)` stop evidence being counted twice.
- `weight` is computed from rung, hints used and time taken (FR-M4-05); `formula_version` keeps old numbers explainable if the formula changes.
- A review is created when effective mastery falls below the threshold (FR-M4-04); only one open review per skill.

### 5.7 Exercises and generation (M6)

```mermaid
erDiagram
  skills ||--o{ exercises : "practised by"
  exercises ||--|| exercise_secrets : "server-only half"
  exercises ||--o{ exercise_tests : "checked by"
  exercises ||--o{ exercise_hints : "5 levels"
  generation_jobs |o--o| exercises : "produced"
  generation_jobs ||--o{ generation_failures : "logged"
  exercises {
    uuid id PK
    uuid skill_id FK
    text language_code FK
    smallint rung "1 to 5"
    int variant_seed
    text content_version "toolchain, prompt, schema"
    enum purpose "practice holdout diagnostic"
    enum source "generated or template"
    enum status "draft verifying verified rejected retired"
    text title
    text prompt_md
    text starter_code
    text function_signature "null for rung 1"
    int time_limit_ms "50 to 10000"
    int memory_limit_mb "16 to 1024"
    uuid created_by FK
    timestamptz verified_at
  }
  exercise_secrets {
    uuid exercise_id PK "also FK"
    text harness_code "null for rung 1"
    text reference_solution
    text brute_force_solution
    text test_generator_code "seeded"
    int generator_seed
  }
  exercise_tests {
    uuid id PK
    uuid exercise_id FK
    smallint seq
    text name
    enum size "small or large"
    enum visibility "sample or hidden"
    text input "stored for sample tests only"
    text expected_output "stored for sample tests only"
  }
  exercise_hints {
    uuid id PK
    uuid exercise_id FK
    smallint level "1 to 5"
    text body_md
    enum source "pregenerated or reference"
    boolean filter_passed
  }
  generation_jobs {
    uuid id PK
    uuid skill_id FK
    text language_code FK
    smallint rung
    int variant_seed
    enum trigger "pregen or on_demand"
    enum status "queued generating verifying succeeded fell_back"
    smallint tries "max 3"
    uuid exercise_id FK
    uuid fallback_exercise_id FK
    text model
    text prompt_version
    timestamptz finished_at
  }
  generation_failures {
    uuid id PK
    uuid generation_job_id FK
    smallint try_no
    enum stage "llm schema compile reference brute_force tests_too_weak sandbox"
    jsonb details
  }
```

- **Content key** `(skill, language, rung, variant_seed, content_version)` is unique: the same request always gets the same frozen exercise.
- **`exercise_secrets`** holds everything a learner must never see. Only the worker and the hint engine read it; API responses are built from `exercises` alone.
- Every test runs inside the frozen harness (ADR-0002), so `exercise_tests` only names the tests; input and output are stored just for the sample tests shown to the learner.
- A generation job points to the exercise it produced; the exercise doesn't point back (one fact, stored once).
- Template exercises use the same tables (`source = template`) and pass the same verification. `purpose = holdout` exercises are never recommended; they are used only for calibration (M13).
- A partial unique key on `generation_jobs` stops two jobs generating the same exercise at once.

### 5.8 Attempts and execution (M7)

```mermaid
erDiagram
  users ||--o{ exercise_attempts : "works on"
  exercises ||--o{ exercise_attempts : "attempted in"
  exercise_attempts ||--o{ submissions : "submits"
  submissions ||--o{ sandbox_runs : "executed by"
  exercises ||--o{ sandbox_runs : "verification runs"
  sandbox_runs ||--o{ run_test_results : "per test"
  exercise_tests ||--o{ run_test_results : "result of"
  exercise_attempts {
    uuid id PK
    uuid user_id FK
    uuid enrollment_id FK
    uuid exercise_id FK
    uuid session_step_id FK
    enum context "practice review diagnostic holdout"
    enum status "active solved abandoned"
    smallint hint_level "0 to 5, server-owned"
    smallint hint_ceiling "from the skill's fade stage"
    smallint ce_count "3 compile errors rule"
    smallint submission_count
    boolean bottomed_out
    timestamptz solved_at
    int active_ms
    timestamptz created_at "when the attempt started"
    timestamptz updated_at
  }
  submissions {
    uuid id PK
    uuid attempt_id FK
    uuid user_id FK
    uuid exercise_id FK
    text language_code FK
    text answer "code, or predicted output on rung 1; deleted once the skill is cleared"
    text answer_sha256 "kept"
    timestamptz answer_purged_at
    text idempotency_key UK
    enum status "queued running completed"
    enum verdict "AC WA CE RE TLE MLE SE"
    smallint tests_passed
    smallint tests_total
    boolean counts_as_attempt
    timestamptz created_at
  }
  sandbox_runs {
    uuid id PK
    enum purpose "submission verification timing"
    uuid submission_id FK
    uuid exercise_id FK
    enum solution_kind "learner reference brute_force empty_main"
    text toolchain_version
    text e2b_sandbox_id
    enum status "queued running completed sandbox_error"
    enum verdict
    text compile_output "truncated"
    int exit_code
    text signal
    int wall_ms
    int peak_memory_kb
    text error_message "for SE"
  }
  run_test_results {
    bigint id PK
    uuid run_id FK
    uuid test_id FK
    enum verdict "AC WA RE TLE MLE"
    int time_ms
    int memory_kb
    text stdout_excerpt
  }
```

- An **attempt** is one learner on one exercise; it owns the server-side hint level (FR-M8-01). A CHECK keeps `hint_level ≤ hint_ceiling`, so the fade limit holds even if application code has a bug.
- A **submission** is one press of Submit. Its `answer` is code on rungs 2–5 and the predicted output on rung 1 (Predict).
- **`context` decides evidence:** practice and review attempts create evidence; diagnostic attempts don't (the diagnostic result seeds mastery once); holdout attempts save a calibration record first, then create evidence.
- `counts_as_attempt` is false for CE (until the 3rd on the same exercise) and for SE.
- `submissions` copies `user_id` and `exercise_id` from the attempt on purpose, for simpler analytics. The server sets them, never the client.
- `sandbox_runs` serves both learner submissions and exercise verification, giving one source for execution analytics.

### 5.9 Hints, sessions and recommendations (M5, M8, M9)

```mermaid
erDiagram
  exercise_attempts ||--o{ hint_events : "hint log"
  exercise_hints |o--o{ hint_events : "text shown"
  enrollments ||--o{ learning_sessions : "studies in"
  learning_sessions ||--o{ session_steps : "ordered steps"
  recommendations ||--o| session_steps : "becomes"
  session_steps |o--o| exercise_attempts : "runs"
  enrollments ||--o{ recommendations : "receives"
  hint_events {
    bigint id PK
    uuid attempt_id FK
    smallint level
    enum kind "offered declined requested delivered blocked denied_ceiling bottomed_out"
    uuid hint_id FK
    text body_md "live hints only"
    jsonb filter_result
    bigint llm_call_id FK
    timestamptz created_at
  }
  learning_sessions {
    uuid id PK
    uuid user_id FK
    uuid enrollment_id FK
    enum status "active paused ended"
    timestamptz started_at
    timestamptz last_active_at
    timestamptz paused_at
    timestamptz ended_at
    enum end_reason "user idle completed"
    int active_ms
  }
  session_steps {
    uuid id PK
    uuid session_id FK
    smallint seq
    enum kind "exercise review diagnostic"
    uuid recommendation_id FK
    uuid exercise_id FK
    enum status "pending active completed skipped"
    timestamptz started_at
    timestamptz completed_at
  }
  recommendations {
    uuid id PK
    uuid enrollment_id FK "identifies the learner"
    uuid skill_id FK
    smallint rung
    enum reason "new_skill review remediation"
    double total_score
    jsonb score_breakdown "readiness goal urgency recency"
    jsonb candidates_snapshot
    text algorithm_version
    uuid exercise_id FK "what was served"
    enum status "proposed accepted completed skipped"
  }
```

- One active session per learner (partial unique key). **The current step is the session's one `active` step** (also a partial unique key), so a paused session resumes exactly there (FR-M9-03) without storing a separate pointer.
- `hint_events` is a log; the current level lives on the attempt. `offered` records the "want a hint?" prompt after the 3rd compile error.
- Each recommendation stores its score breakdown and algorithm version, so it can always be explained.

### 5.10 Scaffolding fade (M12): per skill

```mermaid
erDiagram
  fade_schedules ||--|{ fade_stages : "ordered stages"
  fade_stages ||--o{ skill_scaffolding : "current stage"
  users ||--o{ skill_scaffolding : "help level per skill"
  skills ||--o{ skill_scaffolding : "for"
  users ||--o{ fade_stage_changes : "history"
  fade_schedules {
    uuid id PK
    uuid org_id FK "null means global"
    uuid course_id FK
    text name
    boolean is_default
  }
  fade_stages {
    uuid schedule_id FK "PK part 1"
    smallint stage_no "PK part 2"
    smallint min_rung "easiest rung allowed"
    smallint max_hint_level "hint ceiling"
    smallint advance_rung "rung to solve to move on"
    smallint advance_max_hints "default 1"
    text description
  }
  skill_scaffolding {
    uuid user_id FK "PK part 1"
    uuid skill_id FK "PK part 2"
    text language_code FK "PK part 3"
    uuid schedule_id FK
    smallint current_stage FK
    timestamptz stage_entered_at
    timestamptz created_at
    timestamptz updated_at
  }
  fade_stage_changes {
    uuid id PK
    uuid user_id FK
    uuid skill_id FK
    text language_code FK
    smallint from_stage
    smallint to_stage
    uuid submission_id FK "the solve that triggered it"
    text reason
    timestamptz created_at
  }
```

**Rule:** a skill moves to its next stage when the learner solves that stage's rung with **0 or 1 hint**. Solving rung 5 with 0 or 1 hint **clears** the skill. Help on each skill fades independently, so a brand-new skill always starts with full support.

| Stage | Easiest rung | Max hint level | Moves on when the learner solves |
| --- | --- | --- | --- |
| 1 | 1 Predict | 5 | rung 2 with ≤ 1 hint |
| 2 | 3 Complete | 4 | rung 3 with ≤ 1 hint |
| 3 | 4 Extend | 3 | rung 4 with ≤ 1 hint |
| 4 | 5 Build | 2 | rung 5 with ≤ 1 hint → **skill cleared** |

- Hint ceilings (5, 4, 3, 2) are starting values, tunable in `fade_stages` without code changes.
- The starting stage of each skill is set from the diagnostic writing estimate.
- The composite foreign key `(schedule_id, current_stage)` → `fade_stages` means a skill can never sit on a stage that doesn't exist.
- `fade_stage_changes` records every move with the submission that caused it: the evidence for whether learners need less help over time.

### 5.11 Analytics, research and cost (M13)

```mermaid
erDiagram
  users ||--o{ calibration_records : "measured"
  exercises ||--o{ calibration_records : "holdout"
  users ||--o{ consents : "agrees"
  users |o--o{ audit_log : "actor"
  calibration_records {
    uuid id PK
    uuid user_id FK
    uuid skill_id FK
    text language_code FK
    uuid exercise_id FK "purpose holdout"
    uuid submission_id FK
    double predicted_reading
    double predicted_writing
    enum observed_verdict "passed = AC"
  }
  consents {
    uuid id PK
    uuid user_id FK
    enum kind "research_study data_processing"
    text policy_version
    timestamptz granted_at
    timestamptz revoked_at
  }
  llm_calls {
    bigint id PK
    enum purpose "exercise_generation hint explanation"
    text model
    int input_tokens
    int output_tokens
    int latency_ms
    numeric est_cost_inr
    text ref_type
    uuid ref_id
  }
  audit_log {
    bigint id PK
    uuid actor_id FK
    text action
    text entity
    uuid entity_id
    jsonb data
    inet ip
  }
```

- **Calibration** compares predicted mastery with the result on a held-out exercise (FR-M13-01).
- **Consent** is recorded before any learner data is used in the college study, and is never deleted (`RESTRICT`).
- `llm_calls` tracks token use and estimated cost of every Gemini call.
- Hint trends, bottom-out rate, exercise effectiveness, generation failure rate, execution statistics and LLM cost will be **SQL views** over existing tables, not extra tables. They are written together with the analytics page, once its exact queries are known.

### 5.12 Key constraints

| Table | Constraint | Enforces |
| --- | --- | --- |
| users | UNIQUE(email) | One account per email (FR-M1-01) |
| refresh_tokens | UNIQUE(token_hash) | One row per token |
| skills | UNIQUE(course_id, slug) | No duplicate skills |
| skill_prerequisites | CHECK(skill_id ≠ prerequisite_id); UNIQUE(skill_id, prerequisite_id, language_code) NULLS NOT DISTINCT | No self-loops or duplicate edges |
| enrollments | UNIQUE(user_id, course_id, language_code); FK (course_id, language_code) → course_languages | One enrollment per track, only offered languages |
| mastery_records | PK(user_id, skill_id, language_code); CHECK scores 0–1 | One current value per skill |
| evidence_events | CHECK exactly one source; UNIQUE(submission_id, dimension); UNIQUE(diagnostic_id, skill_id, dimension) | Evidence is real and never counted twice |
| review_items | Partial UNIQUE: one scheduled review per skill | No duplicate reviews |
| exercises | UNIQUE content key; CHECK rung 1–5 | Determinism |
| generation_jobs | Partial UNIQUE content key while queued, generating or verifying | No duplicate generation |
| exercise_attempts | Partial UNIQUE(user_id, exercise_id) where active; CHECK hint_level 0–5; CHECK hint_level ≤ hint_ceiling | One live attempt; the fade limit always holds |
| submissions | UNIQUE(idempotency_key); CHECK answer ≤ 64 KB | No duplicate submissions |
| sandbox_runs | CHECK submission_id is set exactly when purpose = submission | Learner runs always link to their submission |
| learning_sessions | Partial UNIQUE(user_id) where not ended | One active session |
| session_steps | UNIQUE(session_id, seq); partial UNIQUE(session_id) where active | One current step |
| skill_scaffolding | PK(user_id, skill_id, language_code); FK (schedule_id, current_stage) → fade_stages | One fade state per skill, always a real stage |
| consents | Partial UNIQUE(user_id, kind) where not revoked | One live consent of each kind |

Every foreign key that is queried is indexed.

### 5.13 Build order

A table is created only after the tables it points to. Each step is one versioned Drizzle migration; applied migrations are never edited.

| Migration | Tables | Status |
| --- | --- | --- |
| 0000_enable_citext | `citext` extension | **Built** |
| 0001_identity | organizations, users, refresh_tokens | **Built** |
| 0002_curriculum | languages, courses, course_languages, skills, skill_prerequisites, skill_resources | **Built** |
| 0003_enrollment_and_fade | enrollments, fade_schedules, fade_stages, skill_scaffolding | **Built** |
| 0004_exercises | llm_calls, exercises, exercise_secrets, exercise_tests, exercise_hints, generation_jobs, generation_failures | **Built** |
| 0005_sessions | recommendations, learning_sessions, session_steps | **Built** |
| 0006_attempts | exercise_attempts, submissions, sandbox_runs, run_test_results, hint_events, fade_stage_changes | **Built** |
| 0007_diagnostic | diagnostic_items, diagnostic_attempts, diagnostic_responses, diagnostic_results | **Built** |
| 0008_mastery | mastery_records, evidence_events, review_items | **Built** |
| 0009_research | calibration_records, consents | **Built** |
| Later | analytics views; password_reset_tokens, skill_graph_changes, concept_chunks (+ `vector`), audit_log | With their features |

Totals: 38 tables built for the MVP, 4 later (42). Enums are created in the migration of the first table that uses them. The seed (`pnpm db:seed`) loads the C++ language, the `dsa` and `cpp-basics` courses, and the default 4-stage fade schedule; it is safe to run repeatedly.

### 5.14 Data lifecycle

| Data | Kept | Why |
| --- | --- | --- |
| Learner answers (`submissions.answer`) | Until the learner clears that skill; then a worker job empties it and sets `answer_purged_at` | Code is needed while the learner is still working on the skill; afterwards only the results matter |
| Verdicts, test results, evidence, hint logs | Always | They are the learning record and the research data |
| Refresh tokens | Until expiry, then removed by a cleanup job | No value after expiry |
| Consents | Always | Proof of agreement |

---

## 6. UML diagrams

### 6.1 Use case diagram

```mermaid
flowchart LR
  Learner["Actor: Learner"]
  Author["Actor: Author"]
  Admin["Actor: Admin"]
  Clock["Actor: Scheduler (time)"]
  subgraph SYS["AI Tutor system"]
    U1(["Register, then log in"])
    U2(["Choose course, language, goal"])
    U3(["Take diagnostic"])
    U4(["Start, pause, resume session"])
    U5(["Solve exercise"])
    U6(["Ask for a hint"])
    U7(["View progress"])
    U8(["Do a review"])
    U9(["Seed skill graph and resources"])
    U10(["Manage template exercises"])
    U11(["View analytics"])
    U12(["Set fade schedule"])
    U13(["Generate and verify exercise"])
    U14(["Grade submission"])
    U15(["Decay check, schedule reviews"])
    U16(["Advance fade stage"])
  end
  Gemini["Actor: Gemini"]
  E2B["Actor: E2B"]
  Learner --- U1 & U2 & U3 & U4 & U5 & U6 & U7 & U8
  Author --- U9 & U10
  Admin --- U11 & U12
  Clock --- U13 & U15
  U5 -. includes .-> U14
  U14 -. includes .-> U16
  U14 --- E2B
  U13 --- Gemini
  U13 --- E2B
  U6 --- Gemini
```

The scheduler is an actor because mastery decays with time, not only with clicks. Fade advances as part of grading.

### 6.2 Class diagram: domain model

```mermaid
classDiagram
  direction LR
  class User {
    +uuid id
    +string email
    +Role role
  }
  class Enrollment {
    +string languageCode
    +string goalText
  }
  class Course {
    +string slug
  }
  class Skill {
    +string slug
    +SkillType type
    +number decayLambda
    +string sourceUrl
  }
  class MasteryRecord {
    +number readingScore
    +number writingScore
    +Date clearedAt
    +int limitStreak
    +effectiveReading(now) number
    +effectiveWriting(now) number
  }
  class EvidenceEvent {
    +Dimension dimension
    +number weight
    +number scoreBefore
    +number scoreAfter
  }
  class Exercise {
    +int rung
    +string contentVersion
    +isServable() bool
  }
  class ExerciseAttempt {
    +AttemptContext context
    +int hintLevel
    +int hintCeiling
    +int ceCount
    +canAskHint() bool
  }
  class Submission {
    +Verdict verdict
    +bool countsAsAttempt
  }
  class LearningSession {
    +SessionStatus status
    +pause()
    +resume()
    +finish()
  }
  class SessionStep {
    +int seq
  }
  class Recommendation {
    +number totalScore
    +object scoreBreakdown
  }
  class SkillScaffolding {
    +int currentStage
    +ceiling() Limits
    +advanceOn(submission) bool
  }
  User "1" --> "*" Enrollment : enrolls
  Enrollment "*" --> "1" Course : in
  Course "1" *-- "*" Skill : contains
  Skill "*" --> "*" Skill : requires
  User "1" --> "*" MasteryRecord : has
  MasteryRecord "*" --> "1" Skill : for
  MasteryRecord "1" --> "*" EvidenceEvent : explained by
  Skill "1" --> "*" Exercise : practised by
  ExerciseAttempt "*" --> "1" Exercise : on
  ExerciseAttempt "1" *-- "*" Submission : contains
  Enrollment "1" --> "*" LearningSession : studies in
  LearningSession "1" *-- "*" SessionStep : ordered
  SessionStep "*" --> "1" Recommendation : from
  SessionStep "1" --> "0..1" ExerciseAttempt : runs
  User "1" --> "*" SkillScaffolding : help level per skill
  SkillScaffolding "*" --> "1" Skill : for
```

### 6.3 Class diagram: services and adapters

```mermaid
classDiagram
  direction TB
  class JudgeService {
    +grade(submission) Verdict
  }
  class MasteryService {
    +applyEvidence(evidence)
    +effective(record, now) number
  }
  class RecommenderService {
    +next(enrollment) Recommendation
  }
  class HintEngine {
    +requestHint(attempt) Hint
  }
  class OutputFilter {
    +isSolutionLike(text, exercise) bool
  }
  class FadeController {
    +ceiling(user, skill, language) Limits
    +onSolved(submission)
  }
  class ExercisePipeline {
    +generate(contentKey) Exercise
  }
  class MasteryRepository {
    +findForUpdate(user, skill, language)
    +save(record, evidence)
  }
  class SandboxProvider {
    <<interface>>
    +compile(files, language) CompileResult
    +run(binary, input, limits) RunResult
  }
  class LlmProvider {
    <<interface>>
    +generateJson(prompt, schema) object
    +generateText(prompt) string
  }
  class E2BSandbox
  class GeminiLlm
  E2BSandbox ..|> SandboxProvider
  GeminiLlm ..|> LlmProvider
  JudgeService --> SandboxProvider
  JudgeService --> MasteryService
  JudgeService --> FadeController
  ExercisePipeline --> LlmProvider
  ExercisePipeline --> SandboxProvider
  HintEngine --> FadeController
  HintEngine --> OutputFilter
  HintEngine --> LlmProvider
  RecommenderService --> MasteryService
  RecommenderService --> FadeController
  MasteryService --> MasteryRepository
```

- External services sit behind interfaces (`SandboxProvider`, `LlmProvider`); replacing E2B or Gemini means writing one new class.
- Layering per request: route → controller (validate, call service) → service (rules) → repository (SQL).

### 6.4 Sequence: register, then log in

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant W as Web
  participant A as API (M1)
  participant DB as Postgres
  U->>W: Fill in the sign-up form
  W->>A: POST /auth/register (email, password, name)
  A->>A: Validate with zod, check password rules
  A->>DB: Is this email taken?
  A->>A: Hash password with argon2id
  A->>DB: INSERT personal org + user (LEARNER)
  A-->>W: 201 created, no tokens
  W-->>U: Show the login screen
  U->>W: Log in for the first time
  W->>A: POST /auth/login
  A->>DB: Find user by email
  A->>A: Verify the hash
  A->>DB: INSERT refresh token (hash only, new family)
  A-->>W: 204, Set-Cookie: access + refresh (httpOnly)
  Note over W,A: The mobile app gets the same tokens in the body and sends Authorization Bearer
  W->>A: GET /auth/me (cookie sent automatically)
  A->>A: Verify JWT signature and expiry
  A->>DB: Load user
  A-->>W: 200 profile
```

Wrong email and wrong password return the same error; login is rate-limited. When the access token expires, the web app calls `POST /auth/refresh` once and retries.

### 6.5 Sequence: submit code

```mermaid
sequenceDiagram
  autonumber
  actor L as Learner
  participant A as API
  participant DB as Postgres
  participant Q as Redis queue
  participant K as Worker
  participant S as E2B
  L->>A: POST /submissions (attemptId, code, idempotencyKey)
  A->>DB: Is the attempt yours and active?
  A->>DB: INSERT submission (queued)
  A->>Q: Add execution job
  A-->>L: 202 submissionId
  K->>Q: Take job
  K->>DB: Load harness, tests, limits
  K->>S: Compile with clang 19, -std=c++20
  alt compile fails
    S-->>K: Compiler errors
    K->>K: Verdict CE
  else compiled
    loop each test
      K->>S: Run with time and memory limits
      S-->>K: Exit code, output, time, memory
    end
    K->>K: Classify AC, WA, RE, TLE or MLE
  end
  opt the sandbox itself failed
    K->>K: Verdict SE, no evidence
  end
  K->>DB: BEGIN: save run, test results, verdict
  K->>DB: Evidence row + mastery update
  opt AC with 0 or 1 hint
    K->>DB: Advance the skill's fade stage, mark cleared on rung 5
  end
  K->>DB: COMMIT
  L->>A: GET /submissions/id/result (polling)
  A-->>L: Verdict + visible test results
```

### 6.6 Sequence: request a hint

```mermaid
sequenceDiagram
  autonumber
  actor L as Learner
  participant A as API (M8 hints)
  participant F as Fade controller (M12)
  participant DB as Postgres
  participant G as Gemini (small model)
  L->>A: POST /exercises/id/hints
  A->>DB: Lock the attempt row (FOR UPDATE)
  A->>F: Ceiling for this learner on this skill?
  F-->>A: Max hint level = 3
  alt next level is above the ceiling
    A->>DB: hint_event denied_ceiling
    A-->>L: No more hints at this stage. Try one more run.
  else allowed
    A->>DB: Read the stored hint for the next level
    opt no stored hint
      A->>G: Prompt for exactly this level
      G-->>A: Hint text
      A->>A: Output filter vs the reference solution
    end
    A->>DB: attempt.hint_level + 1, hint_event delivered
    opt level is 5
      A->>DB: bottomed_out = true, no mastery credit
    end
    A-->>L: This one level only
  end
```

Hint ladder: 1 Concept · 2 Location · 3 Mechanism · 4 Worked example · 5 Answer (frozen reference solution).

### 6.7 Sequence: get the next step

```mermaid
sequenceDiagram
  autonumber
  actor L as Learner
  participant A as API (M9 session)
  participant R as Recommender (M5)
  participant DB as Postgres
  participant Q as Redis queue
  L->>A: GET /recommendations/next
  A->>R: Next step for this enrollment
  R->>DB: Mastery, prerequisites, due reviews, recent steps, fade stages
  R->>R: Build candidates, score them, pick the highest
  R->>R: Rung from writing score, clamped to the skill's fade stage
  R->>DB: Find a verified exercise the learner hasn't seen
  alt found
    R->>DB: INSERT recommendation (scores, algorithm version)
  else none ready
    R->>DB: Use a template exercise
    R->>Q: Queue generation for next time
  end
  A->>DB: Session step + attempt (hint ceiling copied)
  A-->>L: Skill, rung, exercise without secret fields
```

### 6.8 Sequence: pre-generate an exercise

```mermaid
sequenceDiagram
  autonumber
  participant Q as Redis queue
  participant K as Worker (M6)
  participant G as Gemini (large model)
  participant S as E2B
  participant DB as Postgres
  Q->>K: Job (skill, language, rung, seed)
  K->>DB: Job status generating
  loop up to 3 tries, stops early on success
    K->>G: Generate JSON: prompt, starter, signature, reference, brute force, generator
    G-->>K: Draft
    K->>K: zod schema check
    K->>S: Run reference on all tests, 3 timed runs
    S-->>K: Pass or fail, times
    K->>K: Time limit = max(3 x slowest, floor)
    K->>S: Run brute force
    S-->>K: Small tests pass? Large tests TLE?
    alt every check passes
      K->>DB: INSERT exercise + secrets (verified, frozen), tests, 5 hints
    else a check fails
      K->>DB: generation_failure (stage), bigger n next try
    end
  end
  opt still failing after 3 tries
    K->>DB: Job fell_back, template used
  end
```

### 6.9 State diagrams

**Submission**

```mermaid
stateDiagram-v2
  [*] --> queued : POST /submissions
  queued --> running : worker takes job
  running --> completed : verdict AC WA CE RE TLE MLE
  running --> sandbox_error : E2B fails
  sandbox_error --> queued : retry, max 2
  sandbox_error --> completed : give up, verdict SE
  completed --> [*]
```

**Hint ladder (per attempt)**

```mermaid
stateDiagram-v2
  [*] --> L0 : attempt starts
  L0 --> L1 : learner asks
  L1 --> L2 : learner asks
  L2 --> L3 : learner asks
  L3 --> L4 : learner asks
  L4 --> L5 : learner asks
  L5 --> [*] : bottomed out, no credit
  note right of L2 : each move only if the next level is within the skill's fade ceiling
```

**Fade stage (per skill)**

```mermaid
stateDiagram-v2
  [*] --> stage1 : set from diagnostic
  stage1 --> stage2 : solves rung 2 with 0 or 1 hint
  stage2 --> stage3 : solves rung 3 with 0 or 1 hint
  stage3 --> stage4 : solves rung 4 with 0 or 1 hint
  stage4 --> cleared : solves rung 5 with 0 or 1 hint
  cleared --> [*] : code for this skill is purged
```

**Exercise**

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> verifying : schema valid
  verifying --> verified : reference passes, mutation check passes
  verifying --> rejected : a check fails
  verified --> retired : author retires it or a new version replaces it
  rejected --> [*]
  retired --> [*]
```

**Generation job**

```mermaid
stateDiagram-v2
  [*] --> job_queued
  job_queued --> generating : worker takes job
  generating --> verifying : draft is valid JSON
  verifying --> succeeded : exercise frozen
  verifying --> generating : retry with bigger n, max 2
  verifying --> fell_back : 3 tries used, template served
  succeeded --> [*]
  fell_back --> [*]
```

**Learning session**

```mermaid
stateDiagram-v2
  [*] --> active : POST /sessions
  active --> paused : pause, or idle too long
  paused --> active : resume at the same step
  active --> ended : learner ends it
  paused --> ended : ended, or timed out
  ended --> [*]
  note right of paused : the current step is the one marked active, so resume continues there
```

### 6.10 Activity diagram: next-step selection (M5)

```mermaid
flowchart TD
  S0([Start]) --> A["Load mastery, reviews, graph, fade stages"]
  A --> B["Compute effective mastery for each skill"]
  B --> C{"Any reviews due?"}
  C -->|yes| D["Add due reviews to candidates"]
  C -->|no| E
  D --> E["Add skills whose prerequisites are all above threshold"]
  E --> F{"Any candidates?"}
  F -->|no| G(["Course complete, or diagnostic needed"])
  F -->|yes| H["Score: readiness, goal, urgency, recency"]
  H --> I["Pick the highest, ties broken by skill slug"]
  I --> J["Rung from writing score, clamped to the skill's fade stage"]
  J --> K{"Verified exercise ready?"}
  K -->|yes| M["Serve it"]
  K -->|no| N["Serve a template, queue generation"]
  M --> O(["Save recommendation with score breakdown"])
  N --> O
```

### 6.11 Component diagram

```mermaid
flowchart TB
  subgraph WEB["apps/web (Next.js)"]
    W1["Pages: auth, dashboard, admin analytics"]
    W2["Monaco editor"]
    W3["lib/api client, via Next.js proxy"]
  end
  subgraph API["apps/api (Express): HTTP entry"]
    MW["shared: auth, RBAC, validation, errors, rate limits"]
    MOD["modules m1 to m13: routes, controllers, services, repositories"]
  end
  subgraph WRK["apps/api worker entry: same code, second process"]
    J1["generation jobs"]
    J2["execution jobs"]
    J3["maintenance: decay scan, pre-gen top-up, code purge, token cleanup, sandbox cleanup"]
  end
  subgraph INF["infrastructure adapters"]
    I1["database: Drizzle"]
    I2["queue: BullMQ + ioredis"]
    I3["llm: Gemini adapter"]
    I4["sandbox: E2B judge adapter"]
  end
  TY["packages/types: shared contracts"]
  W3 -->|HTTPS JSON| MW
  MW --> MOD
  MOD --> INF
  WRK --> INF
  WRK --> MOD
  WEB -.-> TY
  API -.-> TY
```

### 6.12 Deployment diagram

```mermaid
flowchart LR
  subgraph CL["Clients"]
    B["Browser"]
    M["Mobile app (next year)"]
  end
  subgraph HO["Application hosting"]
    WH["Web: Next.js + API proxy"]
    AH["API process"]
    KH["Worker process"]
  end
  subgraph MS["Managed data"]
    PG[("Postgres + pgvector")]
    RD[("Redis")]
  end
  subgraph EX["External"]
    E2B["E2B sandboxes, network off"]
    GEM["Gemini API"]
  end
  B -->|pages and /api, cookie| WH
  WH -->|forwards /api| AH
  M -->|Bearer token| AH
  AH --> PG
  AH --> RD
  AH -->|live hints| GEM
  KH --> RD
  KH --> PG
  KH --> E2B
  KH --> GEM
```

In development, Postgres and Redis run locally through `docker compose`.

---

## 7. API design

### 7.1 Conventions

| Item | Convention |
| --- | --- |
| Base path | `/api/v1` |
| Format | JSON over HTTPS |
| Auth | httpOnly cookie (web, through the same-origin Next.js proxy) or `Authorization: Bearer` (mobile); role checked on every author/admin route |
| CSRF | `SameSite` cookies + Origin check on every state-changing request |
| Validation | zod schema per request; shared types in `packages/types` |
| Success | `{ "success": true, "data": {...}, "meta": {...} }` |
| Error | `{ "success": false, "error": { "code", "message", "details" } }` |
| Slow operations | `202 Accepted` + an ID; the client polls for the result |
| Internal operations | Called by services only, never exposed to the client (e.g. recording evidence) |

### 7.2 MVP APIs (10 Nov)

| Module | Endpoints |
| --- | --- |
| M1 Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` |
| M3 Diagnostic | `POST /diagnostic/start` · `POST /diagnostic/:id/answers` · `POST /diagnostic/:id/complete` |
| M4 Mastery | `GET /mastery` · `GET /mastery/:skillId` · evidence recording is internal only |
| M5 Recommender | `GET /recommendations/next` |
| M6 Exercises | `GET /exercises/:id` · `POST /exercises/generate` · `GET /exercises/generation/:jobId` |
| M7 Submissions | `POST /submissions` · `GET /submissions/:id/result` |
| M8 Hints | `POST /exercises/:id/hints` |
| M9 Sessions | `POST /sessions` · `GET /sessions/active` |
| M11 Progress | `GET /progress` |
| M12 Fade | `GET /scaffolding/state` (fade stage and limits per skill) |
| M13 Analytics | `GET /analytics/overview` (admin) |

22 client-facing endpoints, plus internal evidence recording. `POST /auth/refresh` is added to M1 because short-lived access tokens need it. The full plan has ~98 operations; every one maps onto the tables in section 5:

| Module | Ops | Tables |
| --- | --- | --- |
| M1 | 9 | users, organizations, refresh_tokens, password_reset_tokens |
| M2 | 12 | skills, skill_prerequisites, skill_resources, skill_graph_changes |
| M3 | 6 | diagnostic_*, enrollments |
| M4 | 9 | mastery_records, evidence_events |
| M5 | 6 | recommendations |
| M6 | 9 | exercises, exercise_secrets, exercise_tests, exercise_hints, generation_jobs, generation_failures |
| M7 | 7 | submissions, sandbox_runs, run_test_results, exercise_attempts |
| M8 | 7 | hint_events, exercise_hints, exercise_attempts |
| M9 | 8 | learning_sessions, session_steps |
| M10 | 6 | review_items |
| M11 | 6 | reads mastery_records, evidence_events, skills |
| M12 | 6 | fade_schedules, fade_stages, skill_scaffolding, fade_stage_changes |
| M13 | 8 | calibration_records, llm_calls, analytics views |

### 7.3 Auth endpoints (built)

Base: `/api/v1/auth`. Web sends `client` as `web` (default) and works with cookies; the mobile app sends `client: "mobile"` and stores the returned tokens.

| Endpoint | Request | Success | Errors |
| --- | --- | --- | --- |
| `POST /register` | `{ email, password (8–128), displayName (1–80) }` | `201 { user }`, no tokens; the app shows the login screen | `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`, `429 RATE_LIMITED` |
| `POST /login` | `{ email, password, client? }` | Web: `204` + cookies. Mobile: `200 { accessToken, refreshToken, expiresIn }` | `401 INVALID_CREDENTIALS` (same for a wrong email or password), `429` |
| `POST /refresh` | Web: the refresh cookie. Mobile: `{ refreshToken }` | Same as login, with a new token pair | `401 UNAUTHENTICATED` (log in again) |
| `POST /logout` | Same as refresh | `204`, cookies cleared, the whole login revoked | none |
| `GET /me` | Access cookie, or `Authorization: Bearer <accessToken>` | `200 { user: { id, email, displayName, role, timezone, createdAt } }` | `401 TOKEN_EXPIRED` (refresh, then retry), `401 UNAUTHENTICATED` |

Rate limits: login 20 per IP and 5 failures per email per 15 minutes; register 5 per IP per hour; refresh 30 per IP per minute. Any cookie-carrying write from an origin other than the web app gets `403 BAD_ORIGIN`.

---

## 8. Non-functional design

| Requirement | How the design meets it |
| --- | --- |
| NFR-P1 Hint latency | Hints are pre-generated at freeze time; live generation uses the small model only when no stored hint exists |
| NFR-P2 Generation time | Generation runs as a background job; the learner is served a ready or template exercise |
| NFR-S1 Sandbox | Code runs only in E2B with network off and time and memory limits |
| NFR-S2 Hint enforcement | Hint level and ceiling are server-side columns, updated under a row lock |
| NFR-S3 Passwords | argon2id hashes only; refresh tokens also stored as hashes |
| NFR-S4 Role checks | RBAC middleware on every author/admin route, not just in the UI |
| NFR-R1 Generation failure | Automatic fallback to the template bank, no error shown |
| NFR-R2 Sandbox vs code failure | Separate SE verdict; SE never affects mastery |
| NFR-U1 / U2 Accessibility | Monaco keyboard support; progress view uses labels and values, not colour alone |
| NFR-M1 Subject independence | Mastery, recommender and fade work on generic skills; course and language are data, not code |
| NFR-SC1 Scalability | Generation and execution go through BullMQ to a separately scaled worker process |

**Determinism.** Content is generated once, verified and frozen, then served by its content key. Grading uses only sandbox execution with a fixed compiler and seeded test generators. Next-step selection is rule-based with a fixed tie-break, and every recommendation and evidence row records the algorithm or formula version used. No LLM output sits in the grading or selection path.

**Security and privacy beyond the NFRs.** Solutions, harness and hidden tests live in `exercise_secrets` and are never returned. Rate limits protect login, registration and refresh now, and will cover submissions, hints and generation; counters are kept in memory for the single API process and move to Redis when the API runs as several processes. Cookie-carrying writes must come from the web app's origin (CSRF guard). Refresh tokens rotate, and reuse of an old token revokes the whole login. Learner code reaches Gemini only inside live hint prompts, covered by recorded consent, and is deleted once the learner clears the skill.

---

## 9. Requirement traceability

| SRS requirement | Design element |
| --- | --- |
| FR-M1-01 Register with unique ID | `users.email` UNIQUE, sequence 6.4 |
| FR-M1-02 Sessions per user type | JWT + rotating `refresh_tokens`, `users.role` |
| FR-M1-03 Record goal | `enrollments.goal_skill_id`, `goal_text` |
| FR-M1-04 Role-based access | RBAC middleware, route groups in web |
| FR-M1-05 Password reset (Should) | `password_reset_tokens` (after MVP) |
| FR-M2-01 Skills as DAG | `skills`, `skill_prerequisites` |
| FR-M2-02 Reject cycles | Cycle check in M2 service + self-loop CHECK |
| FR-M2-03 Editing screen | **MVP: seeded by script.** Screen after MVP; APIs designed (M2, 12 ops) |
| FR-M2-04 Syntax vs concept type | `skills.skill_type`, `decay_lambda` |
| FR-M2-05 Graph history (Could) | `skill_graph_changes` |
| FR-M3-01 Adaptive test | `diagnostic_items` by difficulty and dimension |
| FR-M3-02 Seed mastery | `diagnostic_results` → `mastery_records`, `evidence_events` (source diagnostic) |
| FR-M3-03 Retake | `diagnostic_attempts.attempt_no` |
| FR-M4-01 Mastery fields | `mastery_records` |
| FR-M4-02 Evidence only | DFD level 1: only process 4 writes D4; `evidence_events` with real source keys; resources never create evidence |
| FR-M4-03 Exponential decay | Effective mastery computed on read, per dimension |
| FR-M4-04 Revision queue | `review_items` created below threshold |
| FR-M4-05 Weighted evidence | `evidence_events.weight` from rung, hints, time |
| FR-M5-01 to 05 Recommender | Activity diagram 6.10, `recommendations.score_breakdown`, no LLM in the flow |
| FR-M6-01 Generate | Generation pipeline, DFD 4.4, sequence 6.8 |
| FR-M6-02 Verify before use | Reference run + mutation check, exercise state diagram |
| FR-M6-03 Template fallback | `exercises.source = template`, process 6.7 |
| FR-M6-04 Log failures | `generation_failures` |
| FR-M7-01 Isolated sandbox | E2B, network off |
| FR-M7-02 Per-test results | `run_test_results` |
| FR-M7-03 Limits reported separately | TLE and MLE verdicts, mutation check |
| FR-M7-04 Structured result to M4, M9 | Sequence 6.5: evidence, fade and session step update |
| FR-M8-01 Hint level on server | `exercise_attempts.hint_level` |
| FR-M8-02 Only current level sent | Sequence 6.6 |
| FR-M8-03 Advance only on request | Hint ladder state diagram; CE ×3 only *offers* |
| FR-M8-04 Output filter | `OutputFilter`, `hint_events.filter_result` |
| FR-M8-05 Log bottom-out | `hint_events` kind `bottomed_out`, `exercise_attempts.bottomed_out` |
| FR-M9-01 Start, pause, resume, end | Session state diagram |
| FR-M9-02 Steps from recommender | `session_steps.recommendation_id` |
| FR-M9-03 Resume at same step | The session's single `active` step |
| FR-M10-01 Revision date from decay | `review_items.due_at`, scheduled decay scan |
| FR-M10-02 Queue visible to M5 | Recommender reads `review_items` |
| FR-M11-01 to 03 Honest progress view | Reads stored mastery, reading and writing kept separate |
| FR-M12-01 Configurable schedule | `fade_schedules`, `fade_stages` (rungs, hint ceilings, advance rule as data) |
| FR-M12-02 Enforce limits | `skill_scaffolding` stage → `hint_ceiling` on each attempt, rung clamp in M5 |
| FR-M13-01 Calibration | `calibration_records`, holdout exercises |
| FR-M13-02 Hint trends | Views over `hint_events` |
| FR-M13-03 Generation rates | Views over `generation_jobs`, `generation_failures` |

---

## 10. Partial implementation status

**Done (in the repository):**

- pnpm monorepo: `apps/api` (Express 5 + TypeScript 6), `apps/web` (Next.js 16, React 19), `packages/types`, `packages/config`. Exact pinned versions, Node 22.
- Local infrastructure via `docker compose`: PostgreSQL 16 with pgvector, Redis 7, with secrets in `.env`; settings validated with zod at startup.
- **Database:** all 38 MVP tables (section 5) as Drizzle schema files with 10 versioned migrations, plus an idempotent seed.
- **Auth (M1):** register, login, refresh, logout and me (section 7.3): argon2id passwords, 15-minute JWT, rotating refresh tokens with theft detection, httpOnly cookies for web and Bearer tokens for mobile, rate limits and a CSRF origin check.
- **Shared layer:** one error type, one response envelope, one error handler.
- **Tests:** 24 automated tests on a separate test database: 16 check the database rules (uniqueness, ranges, fade ceiling, evidence sources) and 8 check the auth flows (including stolen-token reuse and throttling).

**Next (Phase 3, 23 Oct):** skill graph and resources seed, enrollment and diagnostic, mastery engine, first E2B judge run (AC/WA/CE/TLE end to end), API contract frozen for the frontend.

---

## 11. Open items

| Item | Needed by |
| --- | --- |
| DSA and C++ skill list and edges, with further-reading links | Seed data (Phase 3) |
| M4 update formula: size of AC gain and WA penalty | Mastery engine (Phase 3) |
| Prerequisite threshold (0.7 is a placeholder) | Recommender |
| Whether a skill's fade stage can step back after repeated bottom-outs | M12 |
| Template exercises per skill and rung | M6 fallback |
| Session idle and timeout values | M9 |
| Hosting provider within budget | Deployment |
| First ADMIN account (seed from environment variables) | Analytics page |
