# Minor Project – III (MCA-269) — Problem Analysis

**Project:** AI Tutor — An Evidence-Based Adaptive Learning System with Deliberate Scaffolding Withdrawal
**Programme:** Master of Computer Applications, Semester III · Batch 2025–2027
**Institution:** Jagan Institute of Management Studies, Rohini
**Submitted by:** Ashwani Kumar Puri *(Roll No. — to be filled)*
**Guide:** *(to be filled)*
**Date:** 7 September 2026
**Review:** Review 1 — Problem Analysis, Literature Survey, Software Requirements Specification

---

## 1. Purpose and Scope of this Document

The synopsis (`MP3-SYNOPSIS-AI-TUTOR.md`) states the problem in seven paragraphs and moves quickly to the solution. This document does the slower work the synopsis compresses: it defines the problem precisely, traces each identified deficiency to its root cause, identifies who is affected and how, states the objectives the system must meet to resolve them, fixes the scope boundary, and tests the proposal against five feasibility dimensions before committing engineering effort. It is the analytical basis the SRS (`MP3-SRS.md`) then formalises into requirements. Nothing here revises the submitted synopsis; every claim traces back to it or to the literature survey.

## 2. Problem Definition

> Self-directed technical learners have no system that measures or improves their independent construction ability. Every mainstream learning product — video courses, interactive coding platforms, spaced-repetition tools, general-purpose AI assistants, and AI tutoring products alike — measures and rewards *consumption* (content watched, lessons completed, streaks maintained) rather than *capability* (what the learner can build unaided). Where generative AI is present without structural constraint, it makes this worse, not better: a controlled trial on nearly 1,000 students found unrestricted AI assistance produced a **17% reduction** in post-assistance performance relative to no assistance at all (Bastani et al., 2025). The gap is not a missing feature in any one product — it is the absence, across the entire category, of a system that tracks reading and writing ability separately, updates its model of the learner only from executed evidence, and deliberately withdraws its own help on a schedule.

This statement is the problem the proposed system exists to close, and every module in the SRS is traceable to it.

## 3. Study of the Existing System

The "existing system" here is not a legacy application to be replaced — it is the manual, tool-assisted workflow a self-directed learner follows today, assembled from whichever products they reach for at each step. It is documented, not designed, and no single vendor owns its failure modes.

| Step | Actor | Activity | Tooling in use today | Output / artefact |
|---|---|---|---|---|
| 1 | Learner | Identifies a skill to acquire | Job posting, curiosity, curriculum | — |
| 2 | Learner | Selects a course | Udemy, Coursera, free video courses, official docs | A course URL, no learner record |
| 3 | Learner | Watches content sequentially | Video player, linear playlist | Watch-history percentage |
| 4 | Learner | Follows along, typing what is shown | Code editor beside the video | A copy of the instructor's code |
| 5 | Learner | Marks lessons complete | Platform checkbox | Completion percentage |
| 6 | Learner | Attempts independent work | Blank editor, no scaffolding | Frequently nothing produced |
| 7 | Learner | Becomes stuck | — | — |
| 8 | Learner | Asks a general-purpose AI assistant | ChatGPT, Copilot, Claude | Working code, supplied on request |
| 9 | Learner | Proceeds; the immediate problem is resolved | — | No retained capability |
| 10 | Learner | Returns weeks later | — | Material substantially forgotten; no revision was scheduled |

**Where the system breaks down.** Step 3–5 train recognition, not recall, and record that recognition as "progress." Step 6 is the first and only point at which construction is actually demanded, and it is presented as a blank page with no intermediate scaffolding — the single highest-abandonment moment in the whole workflow. Step 8 resolves the immediate blocker but removes the retrieval effort that would have produced learning, and does so while *increasing* the learner's confidence that they understood the material (Roediger & Karpicke, 2006, §2.2 of the literature survey). Step 10 has no counterpart anywhere in the workflow that would have prevented it — nothing in steps 1–9 schedules revision against a forgetting curve.

No step in this workflow maintains a persistent, evidence-based model of what the learner can and cannot do. That absence is the single structural cause underlying every deficiency in §4.

## 4. Root-Cause Analysis

| # | Deficiency (synopsis §2.2) | Root cause | Evidence | Consequence if unaddressed |
|---|---|---|---|---|
| D1 | Completion is measured instead of capability | No product stores executed evidence of construction ability — only content-interaction events | Literature survey §3.2 — MOOC completion 3.13%, and no provider measures post-completion capability at all | Learners and buyers cannot distinguish a genuinely capable graduate from one who watched everything |
| D2 | Recognition is trained; recall is not | Video and read-along formats are re-exposure activities; re-exposure produces confidence without retention | Roediger & Karpicke (2006) — 61% vs 40% retention, re-reading group *predicted* better performance | Learners feel prepared and are not; the failure surfaces only under real construction demand |
| D3 | Curricula are linear; learners are not | No system stores a per-skill mastery estimate, so no system can compute a personalised next step | Author's own diagnostic: 10/11 reading, 0/4 writing — a profile no linear sequence can respond to | Time is spent on already-known material at the expense of the actual gap |
| D4 | No system maintains a learner model | Consequence of D3's root cause, restated as a structural absence rather than a symptom | Corbett & Anderson (1994) — Bayesian Knowledge Tracing exists and is unused by any surveyed consumer product | Every "next step" decision is really the learner guessing, not the system recommending |
| D5 | Generative AI assistance makes the problem materially worse | Assistants are optimised for helpfulness-per-turn, which removes retrieval demand and desirable difficulty in the same action that resolves the learner's immediate question | Bastani et al. (2025) — 17% capability reduction under unrestricted access; guardrailed hint-only access mitigated it | The newest and most widely adopted tool in this workflow is actively regressive unless structurally constrained |
| D6 | Nothing survives disuse | No product computes a forgetting curve or schedules review against it (Anki/Quizlet do, but for facts, not constructed skills) | Cepeda et al. (2006) — spacing interval must scale with desired retention duration; no surveyed skill-building product implements this | Capability measured once is not capability retained; re-learning cost recurs indefinitely |
| D7 | The blank page terminates sessions | No product varies task difficulty by learner readiness; scaffolding is either constant (interactive coding platforms) or absent (practice platforms) | Sweller & Cooper (1985); expertise-reversal effect — worked examples help novices and actively hurt near-experts held at the same level | Abandonment, not slow progress, is the actual failure mode this project is designed against |

Every deficiency traces back to the same absence identified in §3: no persistent, evidence-based model of the individual learner. This is why the proposed system's central engineering artefact is the learner model (M4 in the module table), not the content library.

## 5. Stakeholder Analysis

| Stakeholder | Role | Interest | Current pain | What they need from the system |
|---|---|---|---|---|
| **Learner** | End user acquiring a skill | Become independently capable, efficiently | Cannot tell honest progress from completion theatre; sessions abandoned at the blank page | An honest mastery estimate, tasks matched to current ability, help that fades rather than substitutes |
| **Curriculum author** | Authors and maintains the skill graph and templates | A correct, maintainable prerequisite structure | No existing tooling separates graph authoring from content generation | An authoring interface with cycle validation and template-bank fallback |
| **Administrator** | Operates the platform | Cost control, calibration quality, uptime | No visibility into whether the mastery model's predictions are accurate | Calibration dashboards, generation-failure logs, usage/cost monitoring |
| **Institution / employer (buyer)** | Funds training and is accountable for outcomes | Verifiable evidence that training produced capability, not just completion | Currently buys completion statistics and cannot verify anything beyond them | An evidence-backed capability profile per learner (synopsis §7.2) |
| **Project evaluation panel** | Assesses the academic deliverable | A working system, defensible engineering decisions, integration of semester coursework | — | A system every team member can explain, and a build the panel can operate live |

The learner and the institutional buyer have different needs from the same underlying data — the learner wants a next step; the buyer wants proof. Both needs are served by the same evidence-only mastery model, which is the load-bearing design decision this document and the SRS both organise around.

## 6. Objectives of the Proposed System

Each objective closes one or more deficiencies from §4.

- **O1.** Maintain two separate, per-skill mastery scores (reading, writing) for every learner, updated only from executed evidence. *(Closes D1, D2, D3, D4.)*
- **O2.** Select the next learning step deterministically from a prerequisite graph and the current mastery state, not from a fixed sequence. *(Closes D3, D4.)*
- **O3.** Constrain AI assistance structurally — server-side hint-level control and output filtering, not a prompt-level instruction alone — so that help is available without becoming a substitute for construction. *(Closes D5.)*
- **O4.** Compute mastery decay over time and schedule review before forgetting crosses a threshold. *(Closes D6.)*
- **O5.** Present difficulty as a five-rung ladder selected by current writing ability, so a blank page is only ever reached at the rung the learner is ready for. *(Closes D7.)*
- **O6.** Withdraw scaffolding on a configured schedule tied to the learner's plan, not only in reaction to requests. *(Closes D5, D7; the expertise-reversal effect in the literature survey, §2.5, makes this a correctness requirement, not a nicety.)*
- **O7.** Record every occasion the system was forced to supply a full answer as a measured failure, feeding difficulty calibration rather than being treated as a service rendered. *(Supports O1, O5 by keeping the mastery model honest about what "help" actually happened.)*

## 7. Scope of the Proposed System

### 7.1 In scope (version 1)

- A single skill domain — JavaScript through React, approximately sixty hand-authored nodes.
- Text, code, and machine-generated exercises validated against a reference solution before being served.
- The full learner model: dual reading/writing mastery, exponential decay, deterministic next-step selection.
- The five-rung exercise ladder and the three-mechanism Socratic response engine (hint ladder, output filtering, bottoming-out telemetry).
- Sandboxed, isolated code execution and grading.
- Basic curriculum-authoring and administrative interfaces sufficient for the team to operate the pilot.

### 7.2 Out of scope (recorded as decisions, not omissions — synopsis Appendix)

- Video content of any kind.
- Multiple skill domains in version one.
- Native mobile applications.
- Social features, leaderboards, and streak-based gamification.
- Certification — the mastery graph is the credential.
- Payment processing, deferred to the institutional phase.
- Training of custom language models.
- A bespoke code-execution sandbox — a managed provider is used instead.

Any future addition to scope must displace something already inside it (synopsis §3.2). This constraint exists specifically to prevent the scope drift the department's own guidelines and the literature survey both warn is the industry's default failure mode.

## 8. Feasibility Study

### 8.1 Technical feasibility

Every component of the proposed stack is individually mature and already in production use elsewhere: Next.js/React and TypeScript for the frontend, Monaco for the in-browser editor, Node/Express for the backend, PostgreSQL with pgvector for combined relational and vector storage, Redis with BullMQ for session state and asynchronous job processing, and a managed sandbox service rather than a bespoke execution environment (synopsis §5.2). The genuinely novel engineering work is not infrastructure — it is the mastery mathematics (decay, evidence weighting, next-step scoring) and the generation-validation pipeline, both of which are scoped as version-1 deliverables owned by a single team member with a defined API boundary to the rest of the system (§4.1 of the synopsis). **Verdict: feasible**, with the generation-validation pipeline (M6) as the component carrying the most technical risk — addressed directly in the risk register below.

### 8.2 Operational feasibility

A single hand-authored, sixty-node graph is within the maintenance capacity of one to two curriculum authors, which matches the team's actual composition. Administrative operation (calibration monitoring, cost oversight) is basic dashboard-and-log work, not a specialised operations function. **Verdict: feasible** at the team's current size and division of labour.

### 8.3 Economic feasibility

At pilot scale, the dominant recurring cost is metered API usage (language model calls, sandbox execution minutes), not fixed infrastructure. The two-tier model design — a small model for the high-volume hint and grading traffic, a larger model reserved for exercise generation only — exists specifically to keep this cost bounded (synopsis §5.2). No fixed capital outlay is required to run the validation-gate pilot described in §7.5 of the synopsis. **Verdict: feasible** within a student-scale API budget; a formal cost ceiling should be set before Review 2 once real per-session token counts are measured.

### 8.4 Schedule feasibility

The department's milestone schedule (synopsis §6.4) places this document and the SRS at Review 1, Weeks 3–4 — the window this submission falls inside. The remaining milestones (system design at Review 2, Weeks 6–7; implementation and testing at Review 3, Weeks 9–10; final report and viva in Weeks 11–12) are unchanged by this analysis. **Verdict: feasible**, provided the risks flagged in §9 — particularly R5 and R7 — are actively managed rather than discovered late.

### 8.5 Legal and regulatory feasibility

The system stores learner interaction and performance data (attempts, scores, timestamps) — not health, financial, or other legally protected categories of data. Standard data-minimisation and access-control practice, already required by the security non-functional requirements in the SRS, is sufficient at pilot scale. No new regulatory obligation beyond ordinary educational-technology data handling applies. **Verdict: feasible**, with the usual expectation that consent and data-handling practice are documented in the eventual final report rather than left implicit.

## 9. Risk Analysis

| ID | Risk | Category | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | A generated exercise is unsolvable or its tests are wrong | Technical | Medium | High | Self-verification: execute the reference solution against generated tests before serving (M6); fall back to the authored template bank on failure |
| R2 | Sandbox escape or resource exhaustion during code execution | Security | Low | High | Managed, network-disabled, resource-capped sandbox (M7); building a bespoke sandbox is explicitly out of scope for v1 |
| R3 | Cold start — a new learner has no evidence to seed the mastery model | Product | High | Medium | Diagnostic assessment (M3) seeds initial reading/writing scores before the first recommended step |
| R4 | Single-domain scope reads as narrow to evaluators expecting breadth | Academic | Medium | Medium | Literature survey and methodology (synopsis §6.3) make depth-over-breadth an explicit, defended decision, not an oversight |
| R5 | The commercial/academic validation gate — a non-author learner completing a multi-session project — is not met before submission | Schedule / Commercial | Medium | High | Already flagged as an open risk in synopsis §7.5; needs a scheduled buffer before Review 3, not a Week 11 scramble |
| R6 | Language-model API cost exceeds the pilot budget under real usage | Economic | Low–Medium | Medium | Two-tier routing caps large-model calls to generation only (§8.3); measure real per-session token cost early |
| R7 | Division of work concentrates the learner model, recommender, generation pipeline, sandbox integration, and Socratic engine on one team member | Schedule | Medium | High | Define API contracts between modules early so frontend and UI/UX work is not blocked on backend completion |
| R8 | A determined learner circumvents the hint ladder or output filter | Product integrity | Medium | Low | Dual enforcement — server-side level control plus output filtering (§3.6) — with bottoming-out events logged for calibration, not just blocked |
| R9 | Calibration data is too sparse at pilot scale to validate the mastery model's predictions | Product | Medium | Medium | Held-out challenge exercises (M13) begin collecting calibration signal from the first pilot learner rather than waiting for scale |

## 10. Conclusion

The problem is structural, not a missing feature in any single competitor: no product in the surveyed set maintains a persistent, evidence-based model of the individual learner, and the newest tool in the workflow — unconstrained generative AI — measurably worsens outcomes in the absence of that model. The feasibility study finds no blocking obstacle across technical, operational, economic, schedule, or regulatory dimensions; the material risks are concentrated in the generation-validation pipeline (R1), team bandwidth (R7), and the validation gate (R5), all three trackable rather than open-ended. This analysis, together with the literature survey, supports proceeding directly to the SRS (`MP3-SRS.md`), which locks the objectives in §6 and the module table already defined in the synopsis into numbered functional and non-functional requirements.
