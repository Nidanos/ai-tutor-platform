# ADR-0015: Hints (M8), v1: live tutor first, frozen fallback

- **Status:** Accepted, built (live calls wait for billing, see "Safety switch")
- **Date:** 19 Oct 2026
- **Decided by:** Ashwani Kumar Puri (live first, model, frozen hints generated once)
- **SRS links:** FR-M8-01 to FR-M8-05, FR-M12-02, FR-M13-02; supersedes ADR-0005's "hints are frozen first"

## Decisions made
1. **Live first, frozen fallback.** Each request gets a hint from the live tutor about the learner's own code at that level. If a cap is hit, Gemini fails, or the filter blocks the reply, the frozen hint for that level is served, or a general nudge if none is stored. Grading and selection stay deterministic (ADR-0005's claim still holds: no LLM in those paths).
2. **Model: Gemini 3.5 Flash Lite** for live hints (about ₹0.08 each, so ₹500 buys about 6,000 a month). Frozen hints use **Gemini 3.8 Flash**, once.
3. **Frozen hints 1–4 are generated once** (`pnpm hints:generate`), each checked by the same filter, then frozen. Level 5 is always the answer, never generated.

## How a hint is given (`POST /exercises/:id/hints`, body `{ code? }`)
| Step | Rule |
|---|---|
| Attempt | The learner's latest attempt on a practice exercise must be active (404 / 409 otherwise) |
| Level | Exactly one step up from the stored level (FR-M8-01/03); only that level's text is returned (FR-M8-02) |
| Ceiling | Above the attempt's hint ceiling (from the fade stage, FR-M12-02) → `409 HINT_LIMIT`, logged `denied_ceiling` |
| Levels 1–4 | Live: the prompt has the task, the learner's code, the last run's result (verdict, compiler message, failing *sample* test; hidden tests never), and the reference marked private. 1 Concept · 2 Location · 3 Mechanism · 4 Worked example on a different problem |
| Level 5 | The answer: the reference solution, or the output for a predict-the-output exercise. Logged `bottomed_out` (FR-M8-05); the attempt earns no mastery credit (ADR-0004) |
| Filter (FR-M8-04) | `solution-filter.ts`: blocked if the reply holds ≥ 25 % of the 5-token fingerprints only the solution has (not the starter or the learner's own code), a code block over 6 lines, or a rung-1 exercise's output. Blocked replies are logged `blocked` |
| Caps (ADR-0010) | 20 live calls per learner per day (India time) and ₹500 per month for everyone. Every call is logged in `llm_calls` with its estimated cost |
| Double click | The level moves only from the value the request read; a second click gets `409 HINT_CHANGED` |

## Safety switch
Live calls need **`GEMINI_PAID=true`** in `.env`, set only once billing is active. On the free tier, Google may use prompts to improve its products, and prompts carry learner code (privacy policy §5). Without the switch, learners get frozen hints or a general nudge and nothing leaves the server. Found on 19 Oct: the key's project was still on the free tier.

## Notes
- Model names are constants next to their price (`gemini-provider.ts`), not `.env` as ADR-0010 suggested: the cost estimate needs a price for every model, so a model change is a two-line code change.
- The admin overview now shows hint use (delivered, live, frozen, generic, blocked, ceiling refusals, bottom-outs) and this month's AI spend against ₹500 (ADR-0014).
- Not in v1: the "want a hint?" offer after a third compile error (`offered`/`declined` events); the frontend can show the button prominently instead.
