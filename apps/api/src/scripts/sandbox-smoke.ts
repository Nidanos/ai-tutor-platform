import { e2bProvider } from "../infrastructure/sandbox/e2b-provider.js";
import { judgeTest, overallVerdict } from "../modules/m7_execution/services/judge.js";
import { TOOLCHAINS } from "../modules/m7_execution/services/toolchains.js";

// End-to-end check of the real sandbox: one tiny exercise, six solutions, six expected verdicts.
// Each solution uses one fresh sandbox, about a second of E2B time.
const cpp = TOOLCHAINS.cpp;
const limits = { timeLimitMs: 2000, memoryLimitMb: 256 };
const expected = ["5", "0", "3000000"];

const harness = `#include <iostream>
#include <string>
#include "solution.cpp"
int main(int argc, char** argv) {
  const int inputs[][2] = {{2, 3}, {-5, 5}, {1000000, 2000000}};
  auto [a, b] = inputs[std::stoi(argv[1]) - 1];
  std::cout << add(a, b) << "\\n";
}`;

const solutions = {
  AC: "int add(int a, int b) { return a + b; }",
  WA: "int add(int a, int b) { return a - b; }",
  CE: "int add(int a, int b) { return a + ; }",
  RE: "int add(int a, int b) { volatile int zero = 0; return a / zero + b; }",
  TLE: "int add(int a, int b) { for (volatile long i = 0;; i++) {} return a + b; }",
  // volatile writes: otherwise clang may legally remove an allocation it can see is unused
  MLE: "int add(int a, int b) { volatile char* p = new char[400000000]; for (long i = 0; i < 400000000; i += 4096) p[i] = 1; return a + b; }",
};

let failures = 0;
for (const [want, solution] of Object.entries(solutions)) {
  const started = Date.now();
  const result = await e2bProvider.run({
    files: { [cpp.harnessFile]: harness, [cpp.solutionFile]: solution },
    compileCmd: cpp.compileCmd,
    runCmd: cpp.runCmd,
    tests: [1, 2, 3],
    limits,
  });
  const got = result.compile.ok
    ? overallVerdict(result.tests.map((run, i) => judgeTest(run, expected[i], limits)))
    : "CE";
  if (got !== want) failures++;
  console.log(`${got === want ? "ok  " : "FAIL"} ${want.padEnd(3)} → ${got.padEnd(3)} ${Date.now() - started} ms`);
}
console.log(failures ? `${failures} verdict(s) wrong` : "All six verdicts correct.");
process.exit(failures ? 1 : 0);
