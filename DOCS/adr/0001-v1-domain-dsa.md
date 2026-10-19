# ADR-0001: v1 skill domain is Data Structures & Algorithms

- **Status:** Accepted
- **Date:** 24 Sep 2026, updated 13 Oct 2026
- **Decided by:** Ashwani Kumar Puri

## Context
The 7 Sep drafts (now in `DOCS/archive/2026-09-07-js-react-drafts/`) set the v1 domain as JavaScript → React, about 60 nodes. The Phase-1 PDFs submitted on 24 Sep use DSA instead.

## Decision
- The v1 course is **Data Structures & Algorithms**. More courses follow (frontend, backend, full stack), phased over about a year. The engine is course-agnostic: a course is data, not code (NFR-M1).
- **A full beginner C++ track** exists as its own course (`cpp-basics`). DSA skills on the C++ track depend on its skills, so learners who don't know C++ aren't lost. *(13 Oct; resolves the open question of 25 Sep.)*
- **The skill map is authored by us.** Skill names, descriptions, prerequisite edges and exercises are our own work. Topic names ("pointers", "loops") are common facts, so coverage is cross-checked against university syllabi (e.g. GGSIPU MCA) and the C++ standard's structure.
- **No third-party roadmaps or curricula** *(14 Oct)*. The product is commercial, so nothing from another learning site's course or roadmap is used.
- **Resources link out, never copy** *(13 Oct)*. `skill_resources` holds "further reading" links to the original pages.

## Learning resources *(14 Oct)*
| Kind | Source | Rule |
|---|---|---|
| Text | AI-written explanations, plus "further reading" links to public tutorial and reference sites | The AI writes its own explanations. It never copies, closely paraphrases or is fed text from linked sites (their licences don't allow it). Exact pages per skill are chosen by us and checked to resolve, so the AI never invents links |
| Visual | AI-generated diagrams and flowcharts | Format still open (see `README.md`) |
| Video | **None** *(14 Oct)* | Not offered: third-party video can't sit behind a paywall. Removed in migration 0011 |

## The DSA skill list *(decided 20 Oct)*
Ashwani asked for DSA "from the basics to advanced", as working knowledge rather than only a syllabus. The list is in `apps/api/src/infrastructure/database/seed/dsa.ts`: **49 skills in 8 groups**, with 97 prerequisite edges, 19 of them to C++ basics skills.

| Group | Skills |
|---|---|
| Foundations | Complexity analysis, Recursion |
| Searching and sorting | Linear and binary search, Simple sorts, Merge sort, Quick sort and quickselect, Counting/radix/bucket sort, Binary search on the answer |
| Array, string and math techniques | Prefix sums, Two pointers, Hashing, Sliding window, Matrices and grids, String techniques, String matching, Bit manipulation, Number theory, Combinatorics |
| Linear data structures | Linked lists, Linked list techniques, Stacks, Queues and deques, Monotonic stacks and queues, Designing data structures |
| Trees | Binary trees, Tree problems, Binary search trees, Balanced search trees, Heaps, Tries, Fenwick trees, Segment trees |
| Graphs | Graphs and representations, BFS, DFS, Topological sort, Disjoint set union, Shortest paths, Minimum spanning trees, Bridges and SCCs, Maximum flow and matching |
| Algorithm design | Greedy, Backtracking, DP basics, DP on sequences, Knapsack DP, DP on grids and intervals, Advanced DP |
| Putting it together | Problem solving from constraints |

- **Cross-checked** against GGSIPU MCA-102 (Data and File Structures) and MCA-201 (Design and Analysis of Algorithms), then widened with what working engineers use (string matching, Fenwick and segment trees, monotonic stacks, designing data structures, network flow, advanced DP, a problem-solving capstone).
- **Left out of exercises:** file organisation and external sorting, Strassen, branch and bound, and NP-completeness. They are theory without a fair function-sized exercise; lessons can cover them.
- **Prerequisites across courses:** a seed writes `cpp-basics/<slug>` (for example, Linked lists needs C++ pointers). The recommender holds a DSA skill back until its C++ prerequisite is cleared or written well enough; the placement test covers its own course only; progress names the outside prerequisites; and with nothing open, `GET /recommendations/next` lists the C++ skills to finish first (`waitingFor`) instead of calling the course done.
- **Links** are cppreference pages, where one fits (31 links), checked to resolve. Lessons are AI-written and personalised (next part); exercises and placement items follow in batches, with large generated tests and a brute force that must time out (ADR-0004).

## Consequences
- The seed data in `DOCS/reference/ai-tutor-mvp.ts` (JS→React) is obsolete.
- The submitted PDFs in `DOCS/phase-1-submitted/` are the source of truth for Phase 1.
- The skill list and resources for `dsa` and `cpp-basics` are seed data, authored by Ashwani before the recommender can run.
