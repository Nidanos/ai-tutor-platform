# ADR-0016: Exercise generation (M6), v1

- **Status:** Accepted, built (live runs wait for billing, ADR-0015 "Safety switch")
- **Date:** 19 Oct 2026
- **Decided by:** Ashwani Kumar Puri (trigger, budget, verification, API mode)
- **SRS links:** FR-M6-01 to FR-M6-04, FR-M13-03; ADR-0004, ADR-0005, ADR-0010

## Decisions made
1. **Who starts it: admins/authors, and automatically.** `POST /exercises/generate` (admin or author) asks for one exercise for a skill and rung. The recommender also queues one, quietly, when the best skill for a learner has nothing to serve.
2. **Budget: a separate ₹300 a month** for content that is kept (exercises and their frozen hints), apart from the ₹500 for live hints. When it is spent, jobs fall back to the hand-written bank.
3. **Verification: wrong answers must fail.** In the real sandbox, the reference passes every test, the starter compiles but fails one, and **3 common wrong solutions written by the model each compile but fail one**. This replaces ADR-0004's brute-force/TLE check for the beginner course, where tasks have no slow-but-correct version; that check stays for the DSA course's large inputs.
4. **Normal API calls**, not the Batch API: a whole course costs about ₹110–150 instead of about ₹70, with far less code. Revisit with the DSA course's volume.

## How a job runs (`generate-exercise.ts`)
| Step | Rule |
|---|---|
| Queue | One active job per skill and rung (partial unique index); a second request gets the same job. BullMQ queue `generation`, one job at a time |
| Tries | Up to 3: **Gemini 3.8 Flash, Flash, then Gemini 3.1 Pro (preview)** (ADR-0010: Pro after two failures; 2.5 Pro is no longer offered). Each retry is told why the last draft was rejected |
| Draft | JSON matching a zod schema (`exercise-draft.ts`): title, prompt, signature, a `call` statement using `{{args}}`, starter, reference, 3–6 cases, 3 wrong solutions. Rung 1: a program and its claimed output |
| Prompt | The skill and its description, **only its prerequisites may be used**, the rung's rule (Predict, Diagnose, Complete, Extend, Build), the frozen harness contract, the bank's exercise of the same rung as an example, the skill's existing titles to avoid |
| Verify | The checks in decision 3, on content held in memory (`verifyContent`); a rung-1 program must print exactly the output it claims |
| Store | Only verified content is stored: `source = generated`, `status = verified`, variant numbers from 1000 (templates use 1–99, placement items 100+). Its frozen hints follow (ADR-0015) |
| Failures | Each failed try is logged with its stage (`llm`, `schema`, `compile`, `reference`, `tests_too_weak`, `sandbox`) and reason (FR-M6-04) |
| Fallback | After 3 tries, or when the budget is spent: `fell_back`, pointing at a hand-written exercise of the same skill and rung if one exists (FR-M6-03). An automatic retry of that skill and rung waits a day |

## Costs (Oct 2026 prices)
About ₹1.5 per generated exercise: about ₹0.8 for the Flash draft, about ₹0.5 for its frozen hints, about ₹0.05 of sandbox runs. A Pro try is about ₹2.5. Skills 6–20 (75 exercises) cost about ₹110–150, once.

## Notes
- Analytics shows generation outcomes per skill and rung, failures by stage, and both monthly spends against their caps (ADR-0014).
- Generated exercises are served without human review: the sandbox checks are the gate, as for the hand-written bank. A bad one shows up in the analytics' hardest-exercises list and can be retired.
- Not in v1: lessons (layer 1 of ADR-0010, needs a small schema addition), and generating several variants per rung at once.
