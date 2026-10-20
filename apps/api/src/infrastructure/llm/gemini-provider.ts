import { env } from "../../config/env.js";
import { logCall } from "./llm-log.js";
import type { LlmProvider, LlmRequest } from "./llm-provider.js";

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 15_000;
// Estimates for the budget alarm only (paid Standard tier, ai.google.dev pricing, Oct 2026).
const USD_TO_INR = 88; // update when the rupee moves
const USD_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  "gemini-3.8-flash": { input: 0.75, output: 3.75 },
  "gemini-3.1-pro-preview": { input: 2, output: 12 },
};

// Calls are allowed only with a key on a paid project (privacy policy §5).
export const geminiReady = () => Boolean(env.GEMINI_API_KEY) && env.GEMINI_PAID === "true";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  error?: { message?: string };
};

const costInr = (model: string, input: number, output: number) => {
  const price = USD_PER_MILLION[model];
  if (!price) throw new Error(`No price for ${model}: add it before using the model`);
  return (((input * price.input + output * price.output) / 1e6) * USD_TO_INR).toFixed(4);
};

// Gemini over plain fetch: one POST per call. Thinking is kept minimal (hints are short), and
// every call is logged, including failures, so the monthly spend is always known.
export const geminiProvider: LlmProvider = {
  async generate(req: LlmRequest) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
    if (env.GEMINI_PAID !== "true" && !req.allowFreeTier) throw new Error("GEMINI_PAID is not \"true\": no calls until billing is on (privacy policy §5)");
    const started = Date.now();
    const res = await fetch(`${API}/${req.model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(req.timeoutMs ?? TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        generationConfig: {
          maxOutputTokens: req.maxOutputTokens,
          thinkingConfig: { thinkingLevel: req.thinking ?? "minimal" },
          ...(req.jsonSchema && { responseMimeType: "application/json", responseJsonSchema: req.jsonSchema }),
        },
      }),
    });
    const body = (await res.json()) as GeminiResponse;
    const usage = body.usageMetadata ?? {};
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const input = usage.promptTokenCount ?? 0;
    const output = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
    const status = !res.ok ? "error" : text ? "ok" : "blocked"; // no text back: a safety block
    const callId = await logCall({
      purpose: req.purpose,
      model: req.model,
      promptVersion: req.promptVersion,
      inputTokens: input,
      outputTokens: output,
      latencyMs: Date.now() - started,
      status,
      estCostInr: costInr(req.model, input, output),
      refType: req.ref?.type,
      refId: req.ref?.id,
    });
    if (status !== "ok") throw new Error(`Gemini ${status}: ${body.error?.message ?? body.candidates?.[0]?.finishReason ?? "no text"}`);
    return { text, callId };
  },
};
