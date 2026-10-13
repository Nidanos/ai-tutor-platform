# ADR-0001: v1 skill domain is Data Structures & Algorithms

- **Status:** Accepted
- **Date:** 24 Sep 2026, updated 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri

## Context
The 7 Sep drafts (now in `DOCS/archive/2026-09-07-js-react-drafts/`) set the v1 domain as JavaScript → React, about 60 nodes. The Phase-1 PDFs submitted on 24 Sep use DSA instead.

## Decision
- The v1 course is **Data Structures & Algorithms**. More courses follow (frontend, backend, full stack), phased over about a year. The engine is course-agnostic: a course is data, not code (NFR-M1).
- **A full beginner C++ track** exists as its own course (`cpp-basics`). DSA skills on the C++ track depend on its skills, so learners who don't know C++ aren't lost. *(13 Oct; resolves the open question of 25 Sep.)*
- **The skill map is authored by Ashwani.** Coverage is cross-checked against university syllabi.
  - A typical DSA syllabus has about 100 entries. Language choices, practice platforms and section headers are not skill nodes, which leaves about **75–85 real skills**.
  - All prerequisite edges are authored by us.
- **Resources link out, never copy** *(13 Oct)*. Nidanos is commercial, so no third-party course text or images go into the product. Each skill links to the original articles and docs (`skill_resources`). Skill names, descriptions, edges and exercises are written by us.

## Consequences
- The seed data in `DOCS/reference/ai-tutor-mvp.ts` (JS→React) is obsolete.
- The submitted PDFs in `DOCS/phase-1-submitted/` are the source of truth for Phase 1.
- The skill list and resources for `dsa` and `cpp-basics` are seed data, authored by Ashwani before the recommender can run.
