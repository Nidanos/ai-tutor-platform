// How each language is built and run in the sandbox. `version` is part of every exercise's
// content_version, so changing a toolchain means re-verifying exercises (ADR-0002).
// The frozen harness owns main() and #includes the learner's solution file.
export const TOOLCHAINS = {
  cpp: {
    version: "clang-19 -std=c++20 -O2",
    solutionFile: "solution.cpp",
    harnessFile: "harness.cpp",
    compileCmd: "clang++-19 -std=c++20 -O2 -pipe -o main harness.cpp",
    runCmd: "./main",
  },
} as const;
