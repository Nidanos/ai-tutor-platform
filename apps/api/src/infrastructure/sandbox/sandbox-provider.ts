// The contract every sandbox vendor implements (ADR-0003). It only runs code and returns readings;
// deciding the verdict is M7's judge.
export type Limits = { timeLimitMs: number; memoryLimitMb: number };

export type RunRequest = {
  files: Record<string, string>; // file name → content, written to the work directory
  compileCmd: string;
  runCmd: string; // each test runs as `<runCmd> <test number>`
  tests: number[];
  limits: Limits;
};

export type TestRun = {
  exitCode: number;
  timedOut: boolean;
  timeMs: number;
  peakMemoryKb: number;
  stdout: string;
  stderr: string;
};

export type RunResult = {
  sandboxId: string;
  compile: { ok: boolean; output: string };
  tests: TestRun[]; // empty when compiling failed
};

export type SandboxProvider = { run(request: RunRequest): Promise<RunResult> };
