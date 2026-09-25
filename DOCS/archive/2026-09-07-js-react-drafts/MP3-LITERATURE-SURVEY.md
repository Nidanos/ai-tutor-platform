# Literature Survey

**Project:** AI Tutor — An Evidence-Based Adaptive Learning System with Deliberate Scaffolding Withdrawal
**Minor Project – III (MCA-269)** · Semester III · Batch 2025–2027
**Submitted by:** Ashwani Kumar Puri
**Date:** 7 September 2026

---

## 1. Purpose and method of this survey

This survey examines two bodies of work and the relationship between them.

The **first** is the learning-sciences literature, which has established — over four decades of replicated experimental work — a set of conditions under which durable learning occurs. These findings are not contested within the field.

The **second** is the set of commercial and research systems that deliver technical education. These are examined to determine which of the established findings each system implements.

The survey's central observation emerges from placing the two side by side: **the mechanisms known to produce durable learning are largely absent from the products sold to produce it**, and the reason is not technical difficulty but commercial incentive. This gap is the justification for the proposed system.

Sources were selected on three criteria: foundational papers with sustained citation records; recent empirical work specifically addressing generative AI in learning; and current commercial systems as of 2026.

---

## 2. Foundational learning-science research

### 2.1 The two-sigma problem — the benchmark this field is measured against

**Bloom, B. S. (1984).** *The 2 Sigma Problem: The Search for Methods of Group Instruction as Effective as One-to-One Tutoring.* Educational Researcher, 13(6), 4–16.

Bloom reported that students receiving one-to-one tutoring combined with mastery learning performed approximately **two standard deviations** above students in conventional classroom instruction — meaning the average tutored student outperformed roughly 98% of the classroom cohort. Bloom framed the finding as a problem rather than a result: one-to-one tutoring is effective but economically unscalable, and the research challenge is to find group methods achieving comparable gains.

**Relevance to this project.** Bloom's paper defines the target. Every subsequent system in this survey, including the proposed one, is an attempt to approximate one-to-one tutoring at scale. Two components of Bloom's intervention are directly adopted here: **mastery learning**, in which a learner does not advance until the current material is demonstrably mastered, and **individualised pacing**. The proposed system's learner model is a mechanism for making the first of these machine-checkable.

### 2.2 The testing effect — retrieval as the mechanism of learning

**Roediger, H. L., & Karpicke, J. D. (2006).** *The Power of Testing Memory: Basic Research and Implications for Educational Practice.* Perspectives on Psychological Science, 1(3), 181–210.

Roediger and Karpicke demonstrated that the act of retrieving information from memory produces stronger retention than repeated exposure to the same information. In their experiments, learners who read a passage once and then repeatedly attempted to recall it retained **61%** at one week, against **40%** for learners who read the passage four times. Critically, the re-reading group *predicted* they would perform better — subjective confidence was inversely related to actual retention.

**Relevance to this project.** This finding is the direct empirical basis for the design decision that mastery may only be updated from evidence of production, never from consumption. It also explains the failure mode the project exists to address: watching an instructor is a re-exposure activity, and re-exposure reliably produces confidence without capability. The **exercise ladder** (§3.5 of the synopsis) is a structured retrieval-practice instrument.

### 2.3 Desirable difficulties — why easier instruction teaches less

**Bjork, R. A., & Bjork, E. L. (2020).** *Desirable Difficulties in Theory and Practice.* Journal of Applied Research in Memory and Cognition, 9(4), 475–479.
**Bjork, E. L., & Bjork, R. A. (2011).** *Making Things Hard on Yourself, But in a Good Way: Creating Desirable Difficulties to Enhance Learning.* In Psychology and the Real World, 56–64.

The Bjorks distinguish between conditions that improve *performance during learning* and conditions that improve *long-term retention and transfer* — and demonstrate that these frequently diverge. Manipulations that slow acquisition and increase error rates during practice, including spacing, interleaving, varying practice conditions, and testing, produce superior durable learning. Conditions that make practice feel smooth produce the opposite.

**Relevance to this project.** This is the theoretical foundation of the system's governing design principle. If difficulty during practice is a *cause* of learning rather than an obstacle to it, then a tutoring system that minimises learner difficulty is optimising against its own stated purpose. The proposed system's hint ladder, its refusal to supply solution code, and its scheduled withdrawal of scaffolding are all implementations of deliberately introduced desirable difficulty. The Bjorks' work also explains the commercial problem: because desirable difficulties feel worse in the moment, any product measured on learner satisfaction is structurally discouraged from implementing them.

### 2.4 The spacing effect — quantifying forgetting and revision

**Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).** *Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis.* Psychological Bulletin, 132(3), 354–380.

A meta-analysis of 839 assessments across 317 experiments in 184 articles. It establishes that distributing practice across time produces superior retention to massing it, and — more usefully for system design — that the optimal interval between study episodes **increases as the desired retention interval increases**. The spacing effect is not a fixed schedule but a function of how long the material must last.

**Relevance to this project.** This provides the basis for the mastery-decay model. The system stores a per-skill decay constant and computes effective mastery as an exponential function of time since the last supporting evidence; when effective mastery crosses a threshold, the skill enters the review queue. Cepeda et al. justify both the existence of the decay term and the design decision that its rate should vary by material type rather than being uniform.

### 2.5 The worked-example effect — why scaffolding must be withdrawn, not merely provided

**Sweller, J., & Cooper, G. A. (1985).** *The Use of Worked Examples as a Substitute for Problem Solving in Learning Algebra.* Cognition and Instruction, 2(1), 59–89.
**Sweller, J. (1988).** *Cognitive Load During Problem Solving: Effects on Learning.* Cognitive Science, 12(2), 257–285.

Sweller and Cooper found that novice learners studying worked examples outperformed those solving equivalent problems unaided, because unguided problem solving consumes working-memory capacity on search behaviour rather than on schema construction. Subsequent work established the **expertise reversal effect**: as learner expertise increases, the advantage of worked examples diminishes and eventually reverses, at which point independent problem solving becomes superior.

**Relevance to this project.** Taken together these findings prescribe a *trajectory* rather than a fixed level of support. Support that is correct for a novice is actively harmful for an intermediate learner. This is the direct justification for both the five-rung exercise ladder — which begins with worked examples and prediction tasks and ends with unaided construction — and for the scheduled scaffolding fade. A system that provided constant support, at any level, would be wrong for most of a learner's trajectory.

### 2.6 Knowledge tracing — the established method for modelling learner state

**Corbett, A. T., & Anderson, J. R. (1994).** *Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge.* User Modeling and User-Adapted Interaction, 4(4), 253–278.

Bayesian Knowledge Tracing represents learner knowledge as a set of latent binary variables — one per skill, mastered or not — updated probabilistically from observed performance using a hidden Markov model with four parameters: prior knowledge, learning rate, slip probability and guess probability. It underpins the Cognitive Tutor systems and remains the reference method in the field.

**Relevance to this project, including where the project departs from it.** BKT provides the general approach the proposed learner model follows: infer latent competence from noisy observed evidence, weighted by context. The proposed system departs from classical BKT in three respects, each deliberate and defensible:

1. **Two scores per skill rather than one.** BKT models a single mastery variable. The proposed system separately models comprehension and production ability, on the empirical grounds that these diverge substantially — a measured profile of 10/11 on reading and 0/4 on writing yields a blended figure near 0.65, from which no correct next step can be derived.
2. **Explicit temporal decay.** Classical BKT has no forgetting term; mastery, once attained, persists in the model. The proposed system applies exponential decay per §2.4.
3. **Evidence restricted to execution.** Observations are limited to code that has been run against tests, correct predictions of program behaviour, and solved exercises. Self-report and content completion are excluded entirely.

### 2.7 Effectiveness of intelligent tutoring systems

**VanLehn, K. (2011).** *The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems.* Educational Psychologist, 46(4), 197–221.

A review of controlled comparisons which produced two findings that reframed the field. First, human tutoring's effect size (**d = 0.79**) is substantially lower than Bloom's two-sigma figure had suggested. Second, and consequently, intelligent tutoring systems (**d = 0.76**) perform very nearly as well as human tutors. VanLehn attributes the difference in effectiveness across systems primarily to **interaction granularity** — systems operating at the step or sub-step level outperform those that only evaluate final answers.

**Relevance to this project.** VanLehn's granularity finding is a direct design constraint. A system that only marks a submission correct or incorrect operates at answer granularity and forfeits most of the available effect. The proposed system therefore operates at step granularity: the hint ladder engages with the learner's current attempt rather than with the final answer, struggle is detected within an exercise rather than after it, and the ladder rung is adjusted mid-task. The finding also establishes the realistic ceiling — a well-built automated tutor can approach human tutoring, which makes the project's premise credible rather than speculative.

---

## 3. Recent empirical work: generative AI in learning

### 3.1 Direct experimental evidence that unguarded AI assistance harms learning

**Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025).** *Generative AI Without Guardrails Can Harm Learning: Evidence from High School Mathematics.* Proceedings of the National Academy of Sciences (PNAS).

This is the most directly relevant empirical study to the proposed system, and it is worth stating its design precisely.

A randomised controlled trial conducted across nearly 1,000 students in grades 9–11 at a large high school in Turkey during the Fall 2023–24 semester. Three conditions:

| Condition | Treatment |
|---|---|
| **GPT Base** | Unrestricted access to a GPT-4 chat interface during practice |
| **GPT Tutor** | GPT-4 with guardrails: supplies teacher-designed hints rather than answers |
| **Control** | No AI assistance |

**Findings:**

- During practice with AI access available, both AI groups outperformed the control group. Access improved *apparent* performance.
- When AI access was **removed** for the assessment, students who had used unrestricted GPT-4 performed **17% worse** than students who had never had access at all.
- Students used the unrestricted model as a "crutch," obtaining answers rather than constructing solutions.
- **The guardrailed GPT Tutor condition substantially mitigated the harm.** Constraining the model to hints rather than answers preserved the practice benefit without producing the dependency.

**Relevance to this project.** This study independently validates the project's central premise through a controlled experiment, and does so on two levels. It confirms that *unrestricted* AI assistance measurably damages skill acquisition while simultaneously improving the learner's perceived and observed performance during practice — precisely the failure mode identified in §2.2 of the synopsis. It then confirms that the specific intervention this project proposes — hint-based rather than answer-based assistance — is the effective mitigation.

The proposed system extends the study's design in three directions: the hint ladder is **graduated across five levels** rather than a single hint policy; the constraint is **enforced structurally** through server-side level control and output filtering rather than by prompt instruction alone, which matters because prompt-level constraints are circumventable; and assistance is **withdrawn on a schedule over time** rather than held constant.

### 3.2 Completion as a measure of nothing

**Reich, J., & Ruipérez-Valiente, J. A. (2019).** *The MOOC Pivot.* Science, 363(6423), 130–131.

An analysis of 565 MOOCs offered by MIT and Harvard through edX across 6.5 years, covering 12.67 million course registrations. Completion among all registrants was **3.13%** in 2017–18, down from approximately 4% in the preceding two years and nearly 6% in 2014–15. **52% of registrants never started the course at all.** Completion rates did not improve over six years — including among learners who had stated an intention to complete, and among those who had paid for verified certificates.

**Relevance to this project.** Two conclusions follow. First, the dominant model of online technical education fails at the crude measure of completion, before capability is considered at all. Second, and more significant for this project: no provider in this dataset reports what completers can subsequently *do*. Completion is the industry's terminal metric, and it is a measure of consumption. The proposed system's decision to measure demonstrated production capability and to treat completion as carrying no information addresses a gap that the sector has not attempted to close in over a decade.

---

## 4. Existing systems

### 4.1 Video-based course platforms

*Coursera, Udemy, free video courses*

| Aspect | Assessment |
|---|---|
| Curriculum | Fixed linear sequence, authored for an undifferentiated median learner |
| Learner model | None |
| Progress measure | Percentage of content viewed |
| Assessment | Optional quizzes, typically multiple-choice, not gating progression |
| Adaptivity | None |
| Retention support | None |

**Findings implemented:** none of §2.
**Analysis.** Optimised for content delivery. The learner's role is reception. Every failure mode in §2.2 of the synopsis is present, and completion statistics (§3.2 above) indicate the model's limits at scale.

### 4.2 Interactive coding platforms

*Codecademy, Scrimba*

| Aspect | Assessment |
|---|---|
| Curriculum | Fixed sequence, common to all learners |
| Learner model | None; progress is position in the sequence |
| Progress measure | Exercises completed |
| Assessment | Code execution against fixed tests — genuine, and a real advance |
| Adaptivity | None; identical difficulty for all learners |
| Retention support | None |

**Findings implemented:** retrieval practice (§2.2), partially. Learners produce code rather than watching it.
**Analysis.** A material improvement on video, and the closest existing category to the proposed system. Three deficiencies remain. Scaffolding is heavy and **never withdrawn** — exercises typically present a partially completed file with instructions at every stage, which is rung 3 of the proposed ladder held constant, and by §2.5 is the wrong level for anyone beyond the novice stage. There is no model of the individual learner, so a learner who already knows a topic must work through it regardless. And nothing revisits earlier material.

### 4.3 Practice and assessment platforms

*LeetCode, HackerRank, Exercism*

| Aspect | Assessment |
|---|---|
| Curriculum | None; a searchable problem library |
| Learner model | Solve counts and success rates; no skill-level inference |
| Progress measure | Problems solved, contest rating |
| Assessment | Automated execution against comprehensive test suites — strong |
| Adaptivity | Difficulty labels assigned by editors, not by learner state |
| Retention support | None |

**Findings implemented:** retrieval practice (§2.2), at full difficulty.
**Analysis.** These platforms provide the strongest assessment in the survey and no instruction whatsoever. They presuppose that the learner already knows what to practise and is already capable of unaided construction — i.e. they serve learners who are already at rung 5. For a learner at rung 1 or 2 they present the blank-page problem in its purest form. There is no prerequisite structure and no notion of readiness.

### 4.4 Spaced-repetition systems

*Anki, Quizlet*

| Aspect | Assessment |
|---|---|
| Curriculum | User-authored card decks |
| Learner model | Per-card ease factor and interval — a genuine forgetting model |
| Progress measure | Cards due, retention rate |
| Assessment | Learner self-reports recall difficulty |
| Adaptivity | Interval scheduling adapts per card |
| Retention support | Strong — this is the entire product |

**Findings implemented:** spacing effect (§2.4) and retrieval practice (§2.2), both well.
**Analysis.** The only category in this survey that correctly implements forgetting and scheduled revision. Two limitations prevent it from addressing this project's problem. Assessment is **self-reported** — the learner judges whether they recalled correctly, which is precisely the judgement shown unreliable by §2.2 — and cards test factual recall rather than constructive ability, so no amount of Anki practice establishes whether a learner can write a working program. Authoring is entirely manual.

The proposed system adopts Anki's scheduling insight while replacing self-report with executed evidence and replacing factual cards with construction tasks.

### 4.5 General-purpose AI assistants

*ChatGPT, Claude, GitHub Copilot*

| Aspect | Assessment |
|---|---|
| Curriculum | None |
| Learner model | None persistent across sessions |
| Progress measure | None |
| Assessment | None |
| Adaptivity | Responsive to the immediate request only |
| Retention support | None |

**Findings implemented:** none. Several are actively contradicted.
**Analysis.** The Bastani et al. trial (§3.1) measured this category directly and found a **17% performance reduction** relative to no assistance once access was withdrawn. The mechanism is well understood: an assistant that answers on request removes the retrieval demand (§2.2) and eliminates desirable difficulty (§2.3), while producing a strong subjective impression of progress. The commercial incentive compounds this — these products are measured on engagement and helpfulness ratings, both of which reward answering.

### 4.6 AI tutoring products

*Khanmigo, Duolingo Max*

**Khanmigo** (Khan Academy) is the most closely aligned commercial system. It employs Socratic questioning and is explicitly designed to guide rather than to supply answers; as of March 2026 it is available to free-tier users and is deployed to teachers in more than 44 countries.

**Duolingo Max** adds AI-generated explanation ("Explain My Answer") and conversational roleplay to an existing gamified curriculum, at $29.99 per month.

| Aspect | Khanmigo | Duolingo Max |
|---|---|---|
| Curriculum | Khan Academy's existing linear curriculum | Fixed gamified sequence |
| Learner model | Per-exercise progress within the existing platform | Streaks, XP, unit position |
| Socratic constraint | Yes, prompt-level | No |
| Scaffolding withdrawal | No | No |
| Assessment | Existing exercise checking | Answer matching |
| Retention support | Limited | Streak mechanics — engagement, not spacing |

**Findings implemented:** Khanmigo implements the Socratic constraint (§2.3, partially). Neither implements §2.4, §2.5 or the evidence restriction.

**Analysis.** Khanmigo demonstrates that the Socratic constraint is commercially deliverable at scale, which materially de-risks the proposed system's central mechanism. Three distinctions remain. Its constraint is understood to be **prompt-level**, and prompt-level constraints can be circumvented by a determined user; the proposed system enforces the constraint through server-side state and output filtering. It provides **no scheduled withdrawal of support** — assistance is constant over time, which §2.5 identifies as incorrect for any learner whose expertise is changing. And it layers onto a **linear curriculum** rather than a prerequisite graph, so it cannot skip known material or select a next step from learner state.

Duolingo Max is included as the clearest instance of the incentive problem: streaks and XP are engagement instruments, and the published limitations — brief scripted conversations, no pronunciation scoring — indicate a product optimising for daily return rather than for terminal capability.

---

## 5. Comparative summary

Implementation of established findings across surveyed system categories:

| System category | Retrieval practice §2.2 | Desirable difficulty §2.3 | Spacing §2.4 | Fading scaffolds §2.5 | Learner model §2.6 | Step granularity §2.7 | Evidence-based assessment |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Video courses | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Interactive coding | ◐ | ✗ | ✗ | ✗ | ✗ | ◐ | ✓ |
| Practice platforms | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Spaced repetition | ✓ | ✓ | ✓ | ✗ | ◐ | ✗ | ✗ |
| General AI assistants | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ | ✗ |
| AI tutoring products | ◐ | ◐ | ✗ | ✗ | ◐ | ◐ | ◐ |
| **Proposed system** | **✓** | **✓** | **✓** | **✓** | **✓** | **✓** | **✓** |

✓ implemented · ◐ partially implemented · ✗ absent

---

## 6. Research gap

Three observations follow from the survey.

**First: every mechanism the proposed system implements is individually established.** None of retrieval practice, spacing, desirable difficulty, fading scaffolds, knowledge tracing or step-granular interaction is novel. Each has decades of experimental support. The project's contribution is not the discovery of a mechanism but the **integration of all of them in a single system**, which the comparative table shows has not been done.

**Second: the two design decisions that are genuinely novel are both empirically motivated.** The **separation of comprehension and production mastery** does not appear in the knowledge-tracing literature, which models a single latent competence per skill; it is proposed here because the two diverge in practice to a degree that makes a blended score actively misleading for next-step selection. The **scheduled withdrawal of scaffolding as a configured property of the learner's plan**, rather than as a reaction to requests, follows directly from the expertise reversal effect but is implemented by no system surveyed.

**Third, and most consequential: the gap is commercial rather than technical.** Nothing in §2 is difficult to implement. Spacing is one exponential term. A hint ladder is a server-side integer. The reason these are absent from commercial products is that each of them **reduces measured engagement** — they make the product feel harder, and they are designed to make the user finish and leave. A product measured on time-in-application, daily active users or satisfaction ratings cannot adopt them without damaging its own reported metrics.

This is why the opportunity is available to a new entrant, and it is the strategic basis for the project. The proposed system treats **time-in-application as an anti-metric**: a reduction in it, at constant capability gain, is a product improvement. Incumbent products cannot make that statement, and the Bastani et al. trial indicates that the cost of not making it is a **17% reduction in retained capability**.

---

## 7. References

1. Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö., & Mariman, R. (2025). *Generative AI Without Guardrails Can Harm Learning: Evidence from High School Mathematics.* Proceedings of the National Academy of Sciences.

2. Bjork, E. L., & Bjork, R. A. (2011). *Making Things Hard on Yourself, But in a Good Way: Creating Desirable Difficulties to Enhance Learning.* In M. A. Gernsbacher et al. (Eds.), Psychology and the Real World (pp. 56–64). Worth Publishers.

3. Bjork, R. A., & Bjork, E. L. (2020). *Desirable Difficulties in Theory and Practice.* Journal of Applied Research in Memory and Cognition, 9(4), 475–479.

4. Bloom, B. S. (1984). *The 2 Sigma Problem: The Search for Methods of Group Instruction as Effective as One-to-One Tutoring.* Educational Researcher, 13(6), 4–16.

5. Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). *Distributed Practice in Verbal Recall Tasks: A Review and Quantitative Synthesis.* Psychological Bulletin, 132(3), 354–380.

6. Corbett, A. T., & Anderson, J. R. (1994). *Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge.* User Modeling and User-Adapted Interaction, 4(4), 253–278.

7. Reich, J., & Ruipérez-Valiente, J. A. (2019). *The MOOC Pivot.* Science, 363(6423), 130–131.

8. Roediger, H. L., & Karpicke, J. D. (2006). *The Power of Testing Memory: Basic Research and Implications for Educational Practice.* Perspectives on Psychological Science, 1(3), 181–210.

9. Sweller, J. (1988). *Cognitive Load During Problem Solving: Effects on Learning.* Cognitive Science, 12(2), 257–285.

10. Sweller, J., & Cooper, G. A. (1985). *The Use of Worked Examples as a Substitute for Problem Solving in Learning Algebra.* Cognition and Instruction, 2(1), 59–89.

11. VanLehn, K. (2011). *The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems.* Educational Psychologist, 46(4), 197–221.
