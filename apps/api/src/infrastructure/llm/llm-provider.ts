import type { llmPurpose } from "../database/schema/index.js";

// One door to any LLM (design §4), so the hint engine and generation never depend on a vendor.
export type LlmRequest = {
  purpose: (typeof llmPurpose.enumValues)[number];
  model: string;
  promptVersion: string;
  system: string;
  prompt: string;
  maxOutputTokens: number;
  thinking?: "minimal" | "low"; // more thinking costs more; content that is kept gets "low" (default "minimal")
  jsonSchema?: object; // set: the reply is JSON matching this schema
  ref?: { type: string; id: string }; // what the call was for, kept in the cost log
  timeoutMs?: number; // long content (a lesson) takes longer than a hint
  // Content without any learner data may run before billing is on, on an explicit request only (ADR-0019).
  allowFreeTier?: boolean;
};

export type LlmResult = { text: string; callId: number };

export type LlmProvider = { generate(request: LlmRequest): Promise<LlmResult> };
