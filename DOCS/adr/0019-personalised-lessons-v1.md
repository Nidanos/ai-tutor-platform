# ADR-0019: Personalised lessons (M6 + M8), v1

- **Status:** Accepted, built. All 207 lessons are hand-written and frozen: 60 for C++ basics and 147 for DSA (20 Oct). Gemini generation is built for later courses; live notes wait for billing (ADR-0015 "Safety switch")
- **Date:** 20 Oct 2026
- **Decided by:** Ashwani Kumar Puri (levels plus a live note, contents, budget, hand-writing the C++ lessons now)
- **Links:** ADR-0005, ADR-0010 (layer 1, "Lesson"), ADR-0015, ADR-0016, ADR-0018

## Decisions made
1. **A frozen lesson per skill, language and level, plus a live note.** Each skill has three lessons, one per level: **new** (no reading or writing score yet), **building** (some score) and **strong** (cleared, or writing ≥ 0.7, the score that unlocks the next skills). The learner gets the lesson for today's level, or the nearest level written so far. Over it sits a short **live note** written for this learner. The level variants are what make the lesson personal, at a fixed cost per skill. The note adds the learner's own results without regenerating a whole lesson per person.
2. **Contents:** an explanation (300–700 words), one Mermaid diagram, a worked example program with its exact output and a step-by-step walkthrough, 3–5 common mistakes, and a quick check: a short program whose output the learner predicts. The skill's further-reading links come from the seed (M2), not from the lesson.
3. **C++ basics and DSA lessons are hand-written; generation is for later courses** (Ashwani, 20 Oct: "generate the lessons yourself for now… build the Gemini lesson generation logic for later"). The key's project is on Gemini's free tier, which allows 20 Flash calls a day and no Pro calls: about 9 lessons a day. Hand-writing all 207 kept them in the repository, reviewable and identical in every environment. They pass the same gates as generated lessons.
4. **Budget for generation: ₹300 a month** (`llm_calls.purpose = explanation`), apart from generation's ₹300 (ADR-0016) and the live tutor's ₹500 (ADR-0015). Notes are live-tutor calls: they count against the ₹500 and share the **20 live calls per learner per day** with hints.
5. **Generation may run before billing, on request only.** A lesson holds no learner data, so `pnpm lessons:generate <course> --free-tier` may use the free tier. Notes, hints and exercise generation carry learner data or run for learners, so they never do.

## The gates (`freeze-lesson.ts`), for every lesson
| Gate | Rule |
|---|---|
| Shape | The zod schema in `lesson-draft.ts`: explanation, a diagram the web can draw (flowchart, sequence, state or class diagram, no init directives), example program (≤ 45 lines, with `main`), mistakes, check program (≤ 20 lines) |
| Exercises kept safe | The leak filter of ADR-0015 checks the whole lesson against each verified exercise of the skill: its reference's own code runs, and for rung 1 its output |
| Programs proven | Both programs run in the real sandbox as rung-1 exercises: each must compile and print exactly the output the lesson states |
| Stored | Frozen in `lessons`. A level that already has a lesson, by hand or generated, is never written again by the scripts |

## Hand-written lessons (`seed/cpp-lessons/`, `seed/dsa-lessons/`)
- One Markdown file per skill, named by its slug, with `# new`, `# building` and `# strong`, each holding `## explanation`, `## diagram`, `## example`, `## mistakes` and `## check`. In example and check, the first ```cpp block is the program and the first ```text block its output. `seed/lessons.ts` loads every course's folder.
- `pnpm lessons:seed` (after `pnpm db:seed` and `pnpm exercises:verify`) freezes the missing ones through the gates, as `model = hand-written`. A unit test checks that every skill of each course has all three levels and that each fits the schema.
- Writing them, the gates did their job: the leak filter flagged generic code shared with tiny exercise solutions (reworded), and the sandbox caught wrong stated outputs (corrected). Measured numbers in the DSA lessons, such as swap counts, tree heights and random-test totals, are the sandbox's own output.
- Each lesson avoids the topics of its skill's practice exercises, so it teaches the skill without walking through an exercise.
- DSA has no exercises yet, so its lessons were checked against none. The DSA exercises, when written, must not reuse a lesson's example or check.

## Generated lessons (`generate-lesson.ts`)
| Step | Rule |
|---|---|
| Prompt | The skill and its description; every skill below it, across courses, as "already known"; the level's rule; the titles of the skill's practice exercises, which it must not solve |
| Gates | As above |
| Fact-check | The same model reads the passed draft again and tests **each technical claim one by one**, the mistakes list included, against C++20. Any false claim sends the lesson back with what is true; a fact-check that fails to run doesn't pass the lesson either. This is the "reviewed" step of ADR-0010 |
| Tries | Up to 3: **Gemini 3.8 Flash, Flash, then 3.1 Pro** (as ADR-0016), each told why the last try was rejected |

**Why claim by claim.** The first generated trial lesson (loops, building) passed every gate but said an inner loop's `int i` changes the outer loop's `i`; it only hides it. Asked for "errors" in general, Flash passed it. Asked to go through each claim, Flash caught it, for about ₹0.15 and 14 seconds. High thinking cost about ₹1.8 and found nothing more. A generated lesson costs about ₹0.6 to write plus about ₹0.15 to check.

## The live note (M8, `lesson-note.service.ts`)
- **What the model gets:** the skill, the learner's level with reading and writing as percentages, their last 5 graded results on the skill (verdict and tests passed), and the prerequisites they are weak on (writing score against the score needed). **Never their code, name or email.**
- **What comes back:** 2–4 plain sentences on what to watch in the lesson, and whether to look back at a weak prerequisite first. A reply with code or over 100 words is dropped, but stored empty, so it counts towards the daily limit and isn't paid for again.
- **When:** written once, then reused until the learner practises the skill again. There is no note (null) when there is nothing personal to say yet, when billing is off, or when a cap is hit: the lesson is complete without one.
- **Data:** `lesson_notes` is personal data. It is in the download (`lessonNotes`), and it is **always erased** with the account, even when anonymous numbers are kept (ADR-0018), because each note is written about one person.

## API
| Call | Success |
|---|---|
| `GET /lessons/:skillId?language=cpp` | `200 { level, lesson }`: the learner's level, and the lesson for it or the nearest level (null until one is written) |
| `POST /lessons/:skillId/note?language=cpp` | `200 { note: { bodyMd } \| null }`, rate-limited like hints |

## Data
Migration 0015: the `lesson_level` enum and the `lessons` and `lesson_notes` tables. `lessons` holds no personal data.

## Notes
- Reading a lesson changes no score: evidence comes only from graded work (ADR-0004, ADR-0005).
- The web app draws the diagram with Mermaid's strict security level and hides the check's answer until the learner has guessed.
- Not in v1: lessons written per learner, a human review queue for generated lessons, and learners flagging a lesson for rewriting.
