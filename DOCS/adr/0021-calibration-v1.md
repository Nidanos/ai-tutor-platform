# ADR-0021: Calibration, v1: first tries instead of a holdout bank

- **Status:** Accepted, built (23 Oct 2026)
- **Date:** 23 Oct 2026
- **Decided by:** Ashwani Kumar Puri (the option that gives the pilot usable numbers)
- **Links:** ADR-0004 (mastery formula), ADR-0014 (admin overview), ADR-0018 (data rights), design §5.8 and §5.10, FR-M13-01

## Context
FR-M13-01 asks how well predicted mastery matches what learners actually do. The design measured it on `holdout` exercises, never recommended and served only to check the model. No holdout exercise exists and nothing serves one. Writing a bank (one per skill, 69 across both courses, each verified on E2B) plus a rule for serving it would take days before 5 Nov, and a three-day pilot would give only a few rows per learner.

## Decision
1. **A learner's first counted try at an exercise is a calibration record.** The exercise is new to the learner, and the model's prediction is fixed before the verdict, the same next-attempt test used to judge knowledge-tracing models. Later tries at the same exercise, in that attempt or a new one, are not: the learner has seen it.
2. **The prediction is M4's effective score just before the verdict moves it,** decayed to that moment, for both reading and writing. M4 returns it from `recordEvidence`, after locking the skill's mastery row. Rung 1 is judged against reading, rungs 2–5 against writing. A skill never practised predicts 0, and the record keeps that, because cold starts are part of what is being measured.
3. **Same transaction as the verdict.** M7 asks M4 for the prediction, checks that the learner has no earlier counted try at the exercise, and hands the row to M13 inside the grading transaction. The check runs after M4's row lock, so of two first tries graded at once only one is recorded. An uncounted try (SE, or a CE before the third) is neither evidence nor a record; placement attempts never are.
4. **The rung is copied onto the record** (migration 0016), so M13 reads the right dimension without M6's tables.
5. **Reported in the admin overview** (`calibration`, per course and window): per dimension, the number of tries, the Brier score (0 is perfect; always guessing 0.5 scores 0.25), and a reliability table in fifths of the prediction, mean predicted against the pass rate. Counts only, never a learner (privacy policy §4).
6. **Data rights (ADR-0018):** records are numbers, so they join the download and are kept on erasure only for learners who opted in to research or AI training. They are erased before submissions, which they point at.

## Consequences
- The pilot gives one record per exercise a learner tries, enough for a reliability table across both courses.
- Selection bias: the recommender chooses exercises near the learner's level, so predictions bunch in the middle. This should be reported with the numbers. A holdout bank can be added later; its attempts would be recorded the same way.
- Hints used during the try aren't on the record. Its `submission_id` links to the evidence row, which has them, so an analysis can leave out hinted tries.
