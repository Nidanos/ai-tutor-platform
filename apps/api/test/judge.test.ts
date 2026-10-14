import { describe, expect, it } from "vitest";
import type { TestRun } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { excerpt, judgeTest, overallVerdict, sameOutput } from "../src/modules/m7_execution/services/judge.js";

const LIMITS = { timeLimitMs: 2000, memoryLimitMb: 256 };
const ok: TestRun = { exitCode: 0, timedOut: false, peakMemoryKb: 3_000, stdout: "42\n", stderr: "" };
const judge = (run: Partial<TestRun>, expected = "42") => judgeTest({ ...ok, ...run }, expected, LIMITS);

describe("judge", () => {
  it("accepts the right output, ignoring line endings and trailing spaces", () => {
    expect(judge({ stdout: "1 2 3  \r\n4\r\n\r\n" }, "1 2 3\n4")).toBe("AC");
    expect(sameOutput("1 2", "1  2")).toBe(false); // spaces inside a line still count
  });

  it("gives WA for different output, including an early exit that prints nothing", () => {
    expect(judge({ stdout: "41\n" })).toBe("WA");
    expect(judge({ stdout: "" })).toBe("WA");
  });

  it("gives RE for a crash or a non-zero exit", () => {
    expect(judge({ exitCode: 139, stdout: "" })).toBe("RE"); // segfault
    expect(judge({ exitCode: 1 })).toBe("RE");
  });

  it("gives MLE above the memory limit or on std::bad_alloc", () => {
    expect(judge({ peakMemoryKb: 256 * 1024 + 1 })).toBe("MLE");
    expect(judge({ exitCode: 134, stderr: "terminate called after throwing an instance of 'std::bad_alloc'" })).toBe("MLE");
  });

  it("gives TLE when the time limit killed the test, whatever else happened", () => {
    expect(judge({ timedOut: true, exitCode: 137, peakMemoryKb: 999_999, stdout: "" })).toBe("TLE");
  });

  it("lets the first failing test decide, and calls an empty test list a setup error", () => {
    expect(overallVerdict(["AC", "WA", "TLE"])).toBe("WA");
    expect(overallVerdict(["AC", "AC"])).toBe("AC");
    expect(overallVerdict([])).toBe("SE");
  });

  it("cuts long output to a readable excerpt", () => {
    expect(excerpt("x".repeat(5000))).toMatch(/^x{4000}\n… \(truncated\)$/);
    expect(excerpt("short")).toBe("short");
  });
});
