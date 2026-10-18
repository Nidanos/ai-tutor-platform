import type { llmPurpose } from "../database/schema/index.js";

// One door to any LLM (design §4), so the hint engine and generation never depend on a vendor.
export type LlmRequest = {
  purpose: (typeof llmPurpose.enumValues)[number];
  model: string;
  promptVersion: string;
  system: string;
  prompt: string;
  maxOutputTokens: number;
  jsonSchema?: object; // set: the reply is JSON matching this schema
  ref?: { type: string; id: string }; // what the call was for, kept in the cost log
};

export type LlmResult = { text: string; callId: number };

export type LlmProvider = { generate(request: LlmRequest): Promise<LlmResult> };
