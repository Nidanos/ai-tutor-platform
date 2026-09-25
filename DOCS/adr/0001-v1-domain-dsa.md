# ADR-0001: v1 skill domain is Data Structures & Algorithms

- **Status:** Accepted
- **Date:** 24 Sep 2026
- **Decided by:** Ashwani Kumar Puri

## Context
The 7 Sep drafts (now in `DOCS/archive/2026-09-07-js-react-drafts/`) set the v1 domain as JavaScript → React, about 60 nodes. The Phase-1 PDFs submitted on 24 Sep use DSA instead.

## Decision
- The v1 domain is **Data Structures & Algorithms**. After that comes the frontend stack, then the backend stack, phased over about a year.
- **The skill map is authored by Ashwani.** Coverage is cross-checked against university syllabi.
  - It has about 100 entries. Language choices, practice platforms and section headers are not skill nodes, which leaves about **75–85 real skills**.
  - All prerequisite edges are authored by us.
  - Descriptions, edges and exercises are original.

## Consequences
- The seed data in `DOCS/reference/ai-tutor-mvp.ts` (JS→React) is obsolete.
- The submitted PDFs in `DOCS/phase-1-submitted/` are the source of truth for Phase 1.

## Open
- Does the graph include root nodes for basic C++ (e.g. a C++ prerequisites check before DSA), or does it assume C++ is already known? This was raised on 25 Sep and is not yet decided.
