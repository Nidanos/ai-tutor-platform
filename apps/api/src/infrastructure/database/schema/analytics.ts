import { index, integer, numeric, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, logId } from "./columns.js";

export const llmPurpose = pgEnum("llm_purpose", ["exercise_generation", "hint", "explanation", "embedding"]);
export const llmStatus = pgEnum("llm_status", ["ok", "error", "blocked"]);

// Every Gemini call, with its estimated cost: the budget alarm. A log, so only a loose ref.
export const llmCalls = pgTable(
  "llm_calls",
  {
    id: logId(),
    purpose: llmPurpose().notNull(),
    model: text().notNull(),
    promptVersion: text().notNull(),
    inputTokens: integer().notNull(),
    outputTokens: integer().notNull(),
    latencyMs: integer().notNull(),
    status: llmStatus().notNull(),
    estCostInr: numeric({ precision: 10, scale: 4 }).notNull(),
    refType: text(),
    refId: uuid(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.createdAt), index().on(t.purpose, t.createdAt)],
);
