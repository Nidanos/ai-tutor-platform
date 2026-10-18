export const languageRows = [
  { code: "cpp", displayName: "C++", toolchain: "clang", toolchainVersion: "19", compileFlags: "-std=c++20 -O2" },
];

export const courseRows = [
  { slug: "dsa", title: "Data Structures & Algorithms" },
  { slug: "cpp-basics", title: "C++ Basics" },
];

// Every seeded course is offered in C++ first (ADR-0002); C++ basics is where learners start.
export const DEFAULT_LANGUAGE = "cpp";
export const DEFAULT_COURSE = "cpp-basics";

// A skill moves on when its advanceRung is solved with at most 1 hint; solving rung 5 clears it.
// Hint ceilings (5, 4, 3, 2) are starting values, tunable here.
export const defaultFadeStages = [
  { stageNo: 1, minRung: 1, maxHintLevel: 5, advanceRung: 2, description: "Predict and diagnose, full help" },
  { stageNo: 2, minRung: 3, maxHintLevel: 4, advanceRung: 3, description: "Complete code" },
  { stageNo: 3, minRung: 4, maxHintLevel: 3, advanceRung: 4, description: "Extend working code" },
  { stageNo: 4, minRung: 5, maxHintLevel: 2, advanceRung: 5, description: "Build from a blank page" },
];
