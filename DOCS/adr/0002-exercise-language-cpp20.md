# ADR-0002: Exercise language is C++20 on clang 19

- **Status:** Accepted
- **Date:** 24–25 Sep 2026
- **Decided by:** Ashwani Kumar Puri
- **Resolves:** SRS §9.2 "Decide the exercise language for version 1 and record the decision"

## Decision
| Item | Decision |
|---|---|
| Language standard | **C++20** |
| Compiler | **clang / LLVM 19**, version fixed (installed in the E2B template, see ADR-0003) |
| Reproducibility | The compiler version and flags are fixed. They form part of the exercise's `content_version`, so a frozen exercise gives the same result every time |
| What tests test | **Functions only.** Tests call the student's function |
| Test harness | `main()` plus the test calls are **generated with the exercise and frozen with it** |
| Rungs 2–4 | The student writes or edits a function. It is compiled together with the frozen harness |
| Rung 5 (blank page) | The student writes the program, but the **spec fixes the function signature**. The harness still owns `main()` |

```
student.cpp (the function) ─┐
                            ├─► compile together (clang 19, -std=c++20) ─► run with limits ─► verdict per test
harness.cpp (main + tests) ─┘   (harness generated once and frozen with the exercise)
```

## Rationale
_To be written by Ashwani in his own words: why C++ rather than JS/Python for a DSA tutor._

## Consequences
- **The synopsis justification no longer holds.** Synopsis §5.2 says the backend "shares a runtime with the language being taught". The backend now runs Node while students write C++. The Phase-2 docs must replace that sentence (see open item Q13 in `README.md`).
- Grading needs a compile step, so a **compile error** becomes its own verdict (see ADR-0004).
