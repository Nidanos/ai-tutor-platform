# ADR-0002: Language-agnostic exercises; C++20 on clang 19 ships first

- **Status:** Accepted
- **Date:** 24–25 Sep 2026, updated 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri
- **Resolves:** SRS §9.2 "Decide the exercise language for version 1 and record the decision"

## Decision
| Item | Decision |
|---|---|
| Languages | **The engine is language-agnostic** *(13 Oct)*: DSA will be offered in C++, Java and Python, so learners start in a language they already know. **Only C++ ships for the 10 Nov MVP**; Java and Python follow |
| Where language lives | Every exercise, mastery row and fade row carries a `language_code`. A course lists the languages it offers (`course_languages`) |
| Language standard | **C++20** |
| Compiler | **clang / LLVM 19** (19.1.7 on Debian 13), version fixed in the E2B template (ADR-0003). Flags: `-std=c++20 -O2` (`m7_execution/services/toolchains.ts`) |
| Reproducibility | The compiler version and flags are fixed. They form part of the exercise's `content_version`, so a frozen exercise gives the same result every time |
| What tests test | **Functions only.** Tests call the student's function |
| Test harness | `main()` plus the test calls are **generated with the exercise and frozen with it** |
| Rung 1 (Predict) | The student reads code and submits the **predicted output**; there is no harness *(13 Oct)* |
| Rungs 2–4 | The student writes or edits a function. It is compiled together with the frozen harness |
| Rung 5 (blank page) | The student writes the program, but the **spec fixes the function signature**. The harness still owns `main()` |

```
student.cpp (the function) ─┐
                            ├─► compile together (clang 19, -std=c++20) ─► run with limits ─► verdict per test
harness.cpp (main + tests) ─┘   (harness generated once and frozen with the exercise)
```

## Rationale
_To be written by Ashwani in his own words: why C++ first rather than JS/Python for a DSA tutor._

## Consequences
- **The synopsis justification no longer holds.** Synopsis §5.2 says the backend "shares a runtime with the language being taught". The backend runs Node while students write C++. The Phase-2 docs must replace that sentence (open item Q13 in `README.md`).
- Grading needs a compile step, so a **compile error** becomes its own verdict (ADR-0004).
- Each new language needs its own harness format, time limits (Python is much slower than C++) and judge mapping before it ships.
