import { defaultBuildLogger, Template } from "e2b";
import { env } from "../config/env.js";
import { SANDBOX_TEMPLATE, sandboxTemplate } from "../infrastructure/sandbox/template.js";

// Builds the sandbox machine on E2B. Re-run only when template.ts changes. 2 vCPU / 512 MiB (ADR-0003).
await Template.build(sandboxTemplate, SANDBOX_TEMPLATE, {
  apiKey: env.E2B_API_KEY,
  cpuCount: 2,
  memoryMB: 512,
  onBuildLogs: defaultBuildLogger(),
});
console.log(`Template "${SANDBOX_TEMPLATE}" is ready.`);
