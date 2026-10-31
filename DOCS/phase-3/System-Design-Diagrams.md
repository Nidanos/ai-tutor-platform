# AI Tutor: System Design Diagrams

**An Evidence-Based Adaptive Learning System with Deliberate Scaffolding Withdrawal**

MCA-269 Minor Project, Jagan Institute of Management Studies, Rohini · Guide: Dr. Chetna Laroia

Ashwani Kumar Puri (04914004425) · Aman Dogra (01614004425) · Aditi Tanwar (01814004425)

Taken from the Phase 3 report (Chapter 3, System Design), 21 October 2026.

<div style="page-break-before: always"></div>

## 1. System Architecture

**Figure 1: System architecture**

```mermaid
flowchart TB
  B["Browser: Next.js + Monaco editor"]
  MOB["Mobile app (next year)"]
  API["API: Express 5"]
  PG[("Postgres + pgvector")]
  RD[("Redis: job queue, rate limits")]
  WK["Worker: background jobs"]
  E2B["E2B sandbox, network off"]
  GEM["Gemini"]
  EM["Brevo: email"]
  B -->|HTTPS JSON| API
  MOB -.->|HTTPS JSON| API
  API --> PG
  API -->|add job| RD
  RD -->|take job| WK
  WK --> PG
  WK -->|compile and run code| E2B
  WK -->|generate exercises| GEM
  API -->|live hints and lesson notes| GEM
  API -->|account emails| EM
```

<div style="page-break-before: always"></div>

## 2. Deployment Diagram

**Figure 12: Deployment**

```mermaid
---
config:
  flowchart:
    nodeSpacing: 20
    rankSpacing: 30
    subGraphTitleMargin:
      top: 4
      bottom: 14
---
flowchart TB
  B["Browser"] -->|HTTPS| V["Vercel: tutor.nidanos.com<br/>Next.js web + /api proxy"]
  M["Mobile app (later)"] -->|Bearer token| API
  V -->|/api + origin secret| API
  subgraph R["Render, Singapore (free)"]
    API["API + queue worker<br/>(Node 22, one process)"]
    RD[("Key Value<br/>queue")]
  end
  PG[("Supabase, Mumbai<br/>PostgreSQL 17")]
  subgraph EXT["Outside services"]
    E2B["E2B sandboxes, internet off<br/>code + tests, no identity"]
    G["Google Gemini API<br/>content and hints"]
    BR["Brevo email (EU)<br/>account emails, address only"]
  end
  P["Pinger<br/>/health every 10 min"] -.-> API
  API --> RD
  API -->|session pooler| PG
  API --> EXT
  PG -.->|nightly encrypted backup| L["Home server laptop<br/>(Ubuntu 24.04)"]
```

<div style="page-break-before: always"></div>

## 3. Use Case Diagram

**Figure 2: Use case diagram**

```mermaid
---
config:
  flowchart:
    nodeSpacing: 15
    rankSpacing: 30
---
flowchart LR
  Learner["Actor: Learner"]
  Author["Actor: Author"]
  Admin["Actor: Admin"]
  Clock["Actor: Scheduler<br/>(time)"]
  subgraph SYS["AI Tutor system"]
    U1(["Register, then<br/>log in"])
    U2(["Choose course,<br/>language, goal"])
    U3(["Take diagnostic"])
    U4(["Start, pause,<br/>resume session"])
    U5(["Solve exercise"])
    U6(["Ask for a hint"])
    U7(["View progress"])
    U8(["Do a review"])
    U9(["Seed skill graph<br/>and resources"])
    U10(["Manage template<br/>exercises"])
    U11(["View analytics"])
    U12(["Set fade<br/>schedule"])
    U13(["Generate and<br/>verify exercise"])
    U14(["Grade submission"])
    U15(["Decay check,<br/>schedule reviews"])
    U16(["Advance fade<br/>stage"])
    U17(["Reset a<br/>forgotten<br/>password"])
    U18(["Correct, download<br/>or delete<br/>my data"])
    U19(["Erase deleted<br/>accounts"])
    U20(["Read the lesson<br/>for my level"])
    U21(["Write and freeze<br/>lessons"])
  end
  Gemini["Actor: Gemini"]
  E2B["Actor: E2B"]
  Brevo["Actor: Brevo<br/>(email)"]
  Learner --- U1 & U2 & U3 & U4 & U5 & U6 & U7 & U8 & U17 & U18 & U20
  Author --- U9 & U10 & U21
  U20 --- Gemini
  U21 --- E2B
  Admin --- U11 & U12
  Clock --- U13 & U15 & U19
  U5 -. includes .-> U14
  U14 -. includes .-> U16
  U14 --- E2B
  U13 --- Gemini
  U13 --- E2B
  U6 --- Gemini
  U17 --- Brevo
```

<div style="page-break-before: always"></div>

## 4. Class Diagram (Domain Model)

**Figure 3: Domain model**

```mermaid
classDiagram
  direction TB
  class User {
    +id
    +email
    +role
  }
  class Enrollment {
    +languageCode
    +goalText
  }
  class Course {
    +slug
  }
  class Skill {
    +slug
    +type
    +decayLambda
  }
  class MasteryRecord {
    +readingScore
    +writingScore
    +clearedAt
    +limitStreak
    +effectiveReading()
    +effectiveWriting()
  }
  class EvidenceEvent {
    +dimension
    +weight
    +scoreBefore
    +scoreAfter
  }
  class Exercise {
    +rung
    +contentVersion
    +isServable()
  }
  class ExerciseAttempt {
    +context
    +hintLevel
    +hintCeiling
    +ceCount
    +canAskHint()
  }
  class Submission {
    +verdict
    +countsAsAttempt
  }
  class LearningSession {
    +status
    +pause()
    +resume()
    +finish()
  }
  class SessionStep {
    +seq
  }
  class Recommendation {
    +totalScore
    +scoreBreakdown
  }
  class SkillScaffolding {
    +currentStage
    +ceiling()
    +advanceOn()
  }
  class Lesson {
    +level
    +languageCode
  }
  User "1" --> "*" Enrollment : enrolls
  Enrollment "*" --> "1" Course : in
  Course "1" *-- "*" Skill : contains
  Skill "*" --> "*" Skill : requires
  User "1" --> "*" MasteryRecord : has
  MasteryRecord "*" --> "1" Skill : for
  MasteryRecord "1" --> "*" EvidenceEvent : explained by
  Skill "1" --> "*" Exercise : practised by
  Skill "1" --> "*" Lesson : taught by
  ExerciseAttempt "*" --> "1" Exercise : on
  ExerciseAttempt "1" *-- "*" Submission : contains
  Enrollment "1" --> "*" LearningSession : studies in
  LearningSession "1" *-- "*" SessionStep : ordered
  SessionStep "*" --> "1" Recommendation : from
  SessionStep "1" --> "0..1" ExerciseAttempt : runs
  User "1" --> "*" SkillScaffolding : help level per skill
  SkillScaffolding "*" --> "1" Skill : for
```

<div style="page-break-before: always"></div>

## 5. ER Diagram (Table Groups)

**Figure 9a: Overview of the table groups.**

```mermaid
---
config:
  flowchart:
    nodeSpacing: 12
    rankSpacing: 30
---
flowchart TB
  G1["<b>Identity and consent (M1)</b><br/>organizations<br/>users<br/>refresh_tokens<br/>password_reset_tokens<br/>consents"]
  G2["<b>Courses and skill graph (M2)</b><br/>languages<br/>courses<br/>course_languages<br/>skills<br/>skill_prerequisites<br/>skill_resources<br/>skill_graph_changes<br/>concept_chunks"]
  G3["<b>Enrollment and placement (M1, M3)</b><br/>enrollments<br/>diagnostic_items<br/>diagnostic_attempts<br/>diagnostic_responses<br/>diagnostic_results"]
  G4["<b>Mastery and reviews (M4, M10)</b><br/>mastery_records<br/>evidence_events<br/>review_items"]
  G5["<b>Exercises, lessons and generation (M6)</b><br/>exercises<br/>exercise_secrets<br/>exercise_tests<br/>exercise_hints<br/>generation_jobs<br/>generation_failures<br/>lessons<br/>lesson_notes"]
  G6["<b>Attempts and execution (M7)</b><br/>exercise_attempts<br/>submissions<br/>sandbox_runs<br/>run_test_results"]
  G7["<b>Sessions, hints, recommendations (M5, M8, M9)</b><br/>learning_sessions<br/>session_steps<br/>recommendations<br/>hint_events"]
  G8["<b>Scaffolding fade (M12)</b><br/>fade_schedules<br/>fade_stages<br/>skill_scaffolding<br/>fade_stage_changes"]
  G9["<b>Analytics, research, cost (M13)</b><br/>calibration_records<br/>llm_calls<br/>audit_log"]
  G1 --> G3
  G2 --> G3
  G2 --> G5
  G5 --> G6
  G1 --> G6
  G6 --> G4
  G1 & G2 --> G4
  G1 & G2 --> G8
  G3 --> G7
  G7 <--> G6
  G1 --> G9
```

<div style="page-break-before: always"></div>

## 6. Data Flow Diagram, Level 0

**Figure 10a: Level 0 (context)**

```mermaid
flowchart LR
  L["Learner"]
  AU["Author"]
  AD["Admin"]
  GEM["Gemini LLM"]
  SBX["E2B sandbox"]
  EM["Email service (Brevo)"]
  P0(("0 AI Tutor System"))
  L -->|sign-up, goal, language,<br/>answers, code, hint and<br/>data requests| P0
  P0 -->|lessons, exercises, verdicts,<br/>one hint level, progress,<br/>reviews, a copy of their data| L
  AU -->|skill graph seed, resources, lessons, template exercises| P0
  P0 -->|validation results| AU
  AD -->|fade schedule, report requests| P0
  P0 -->|calibration and usage reports| AD
  P0 -->|generation and hint prompts| GEM
  GEM -->|JSON exercise drafts, hint text| P0
  P0 -->|code, harness, limits| SBX
  SBX -->|compiler output, exit codes, time, memory| P0
  P0 -->|reset and deletion emails,<br/>address only| EM
```

<div style="page-break-before: always"></div>

## 7. Sequence Diagram: Submitting Code

**Figure 6: Submit code.**

```mermaid
---
config:
  sequence:
    actorMargin: 20
    width: 110
    wrap: true
    messageMargin: 22
    boxMargin: 5
    noteMargin: 5
    mirrorActors: false
---
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

<div style="page-break-before: always"></div>

## 8. Activity Diagram: Choosing the Next Step

**Figure 8: Activity diagram, next-step selection, as built (recommender m5-v1, ADR-0011).**

```mermaid
flowchart TB
  A["Candidates: prerequisites met and not cleared, plus cleared skills due for review"] --> F{"Any?"}
  F -->|no| G(["Course complete"])
  F -->|yes| H["Score and sort: in progress, review urgency, goal"]
  H --> J["Rung from writing, at least the fade stage's easiest"]
  J --> K{"Exercise to serve?"}
  K -->|yes| O(["Serve it; save the pick and its reasons"])
  K -->|no| N["Next candidate"]
  N --> J
```
