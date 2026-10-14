import { Sandbox } from "e2b";
import { env } from "../../config/env.js";
import type { RunRequest, SandboxProvider, TestRun } from "./sandbox-provider.js";
import { SANDBOX_TEMPLATE } from "./template.js";

const WORKDIR = "/home/user/run";
const COMPILE_TIMEOUT_S = 10;
const OUTPUT_BYTES = 65_536; // compiler output, and each test's stdout
const STDERR_BYTES = 4_096;
const ADDRESS_SPACE_SLACK_MB = 64; // the runtime's own mappings; real usage is judged on peak memory
const SANDBOX_LIFETIME_MS = 120_000; // safety net: E2B kills the sandbox even if our kill() fails
const TIMED_OUT = new Set([124, 137]); // `timeout` exit codes: limit hit, then forced kill

// One fresh, offline sandbox per submission: nothing leaks between runs (ADR-0003).
// Three round trips: create, write files, then compile + all tests.
export const e2bProvider: SandboxProvider = {
  async run(request) {
    const sandbox = await Sandbox.create(SANDBOX_TEMPLATE, {
      apiKey: env.E2B_API_KEY,
      allowInternetAccess: false,
      timeoutMs: SANDBOX_LIFETIME_MS,
    });
    try {
      await sandbox.files.write(Object.entries(request.files).map(([name, data]) => ({ path: `${WORKDIR}/${name}`, data })));

      const maxMs = COMPILE_TIMEOUT_S * 1000 + request.tests.length * (request.limits.timeLimitMs + 2_000) + 10_000;
      const { stdout } = await sandbox.commands.run(script(request), { timeoutMs: maxMs });
      const [compileLine, ...testLines] = stdout.split("\n").filter(Boolean);
      const [compileCode, compileOutput] = compileLine.split(" ");
      const ok = compileCode === "0";
      const output = TIMED_OUT.has(Number(compileCode))
        ? `Compiling took longer than ${COMPILE_TIMEOUT_S} s`
        : fromBase64(compileOutput);
      return { sandboxId: sandbox.sandboxId, compile: { ok, output }, tests: ok ? testLines.map(parseTestLine) : [] };
    } finally {
      sandbox.kill().catch(() => {}); // not awaited: the learner shouldn't wait for clean-up
    }
  },
};

// Compile and every test in ONE command: the network, not the work, is the slow part.
// Every line is printed by us after the program has ended, with output in base64, so learner code
// can't break the format. Line 1: "<compile exit> <output>". Then per test:
// "<exit code> <peak KB> <stdout> <stderr>". Always exits 0, because commands.run throws otherwise.
// Tests stop after a crash or time-out: the first failing test decides the verdict anyway.
function script({ compileCmd, runCmd, limits, tests }: RunRequest) {
  const addressSpace = (limits.memoryLimitMb + ADDRESS_SPACE_SLACK_MB) * 1024 * 1024;
  const run = `timeout -k 1 ${limits.timeLimitMs / 1000} prlimit --as=${addressSpace} --stack=unlimited ${runCmd} $n`;
  return [
    `cd ${WORKDIR}`,
    `timeout ${COMPILE_TIMEOUT_S} ${compileCmd} > compile.log 2>&1; code=$?`,
    `echo "$code $(head -c ${OUTPUT_BYTES} compile.log | base64 -w0)"`,
    `[ $code -ne 0 ] && exit 0`,
    `for n in ${tests.join(" ")}; do`,
    `  /usr/bin/time -f %M -o mem.$n ${run} < /dev/null > out.$n 2> err.$n; code=$?`,
    `  echo "$code $(tail -n 1 mem.$n) $(head -c ${OUTPUT_BYTES} out.$n | base64 -w0) $(head -c ${STDERR_BYTES} err.$n | base64 -w0)"`,
    `  [ $code -ne 0 ] && break`,
    `done; exit 0`,
  ].join("\n");
}

const fromBase64 = (text = "") => Buffer.from(text, "base64").toString("utf8");

function parseTestLine(line: string): TestRun {
  const [code, peakKb, stdout, stderr] = line.split(" ");
  const exitCode = Number(code);
  return {
    exitCode,
    timedOut: TIMED_OUT.has(exitCode),
    peakMemoryKb: Number(peakKb) || 0,
    stdout: fromBase64(stdout),
    stderr: fromBase64(stderr),
  };
}
