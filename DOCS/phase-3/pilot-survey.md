# Pilot survey (8–10 Nov 2026)

A short, anonymous survey for the adult pilot learners, about 5 minutes. It asks what the logs can't: whether the system *felt* right to the people using it. The logs (`pnpm pilot:export`) show what they did; the survey shows what they thought, and the final report sets the two side by side.

## How to run it
- **Where:** a Google Form. Settings: *Collect email addresses* **off**, *Limit to 1 response* **off** (it needs a Google sign-in), no file uploads. Then the form holds no personal data.
- **When:** at the end of the pilot, 10 Nov. Link it from the dashboard (a "Tell us how it went" banner, 9–10 Nov) and send it in the pilot group too.
- **Anonymous on purpose:** answers aren't linked to accounts or to the export's `L001`… aliases. Compare the two only as groups.
- **Required:** sections B and C. Everything else is optional.

## Opening text
> Thanks for trying AI-Tutor. This survey is anonymous: it doesn't ask for your name or email, and your answers aren't linked to your account. It's voluntary, and you can skip any question. We'll use the answers, combined with everyone else's, in our MCA project report. It takes about 5 minutes.

## A. About you (optional)
1. Before the pilot, how much had you programmed? *None · Under 6 months · 6 months to 2 years · Over 2 years*
2. Which course did you use? *C++ basics · Data Structures & Algorithms · Both*
3. About how long did you use AI-Tutor in total? *Under 30 minutes · 30–60 minutes · 1–3 hours · Over 3 hours*
4. Did you take the placement test? *Yes · No · Started but didn't finish*

## B. Ease of use (System Usability Scale)
*Strongly disagree (1) to Strongly agree (5).* These are the ten standard SUS statements (Brooke, 1996), unchanged so the score can be compared with other systems:
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

## C. How the tutor worked
*Strongly disagree (1) to Strongly agree (5), plus "Didn't use this".* Each statement checks one claim of the design; the report pairs it with a number from the logs.

| # | Statement | Checks | Compare with (logs) |
|---|---|---|---|
| 1 | The placement test started me at about the right level. | Placement (M3) | First-try pass rate on the first skills served after it |
| 2 | My reading and writing scores matched how good I feel I am. | Honest progress (M11) | Calibration: predicted vs actual |
| 3 | Seeing reading and writing as separate scores was useful. | Separate scores | — |
| 4 | The hints helped me find the problem myself, without just giving me the answer. | Socratic hints (M8) | Hint levels used; how often learners went to the last hint (the answer) |
| 5 | As I went on, I could solve exercises with less help. | Fading help (M12) | Fade-stage moves; hints per try, early vs late |
| 6 | The next exercise it chose felt like the right next step. | Recommender (M5) | Pass rate on recommended exercises |
| 7 | The lesson explained the skill clearly before I practised. | Lessons | — |
| 8 | When my code failed, the result told me clearly what went wrong. | Verdicts and tests (M7) | Repeat failures in the same attempt |
| 9 | When a skill was marked cleared, I really could do it on my own. | Clearing rule | — |
| 10 | I wrote more code myself here than with other ways I've learned (videos, books, AI chat). | The project's aim | Submissions per learner |

## D. In your own words (optional)
1. What helped you most?
2. What was most confusing or frustrating?
3. Did anything feel wrong or unfair: a verdict, a hint, a score, a suggested exercise? What happened?
4. Would you keep using AI-Tutor if it were available? *Yes · Maybe · No*, and why?

Ask people not to type their name, email or code in these answers. Remove any that slip in before the answers are shared.

## Analysis for the report
- **SUS score** per response: for odd items, the answer minus 1; for even items, 5 minus the answer. Add the ten and multiply by 2.5 (0–100). Report the mean and the median. About 68 is average; above 80 is good.
- **Section C:** per statement, the median and the share who agree (4 or 5), leaving out "Didn't use this". With a small pilot, report counts ("7 of 9 agreed"), not just percentages.
- **Pairing with the logs:** set each statement in C beside its log number above, as group results. For example, statement 2 beside the calibration table (ADR-0021), and statement 4 beside how often hints reached level 5.
- **Section D:** group the comments into themes and quote a few short ones without anything that identifies the writer. Each comment that shows a bug goes on the defect list.
- **Limits to state:** a small, self-selected group of adults over three days; agreement isn't learning; answers can't be linked to logs, by design.
