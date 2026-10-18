import { gte } from "drizzle-orm";
import { startOfIstMonth } from "../../shared/utils/ist.js";
import { sumOf } from "../database/aggregates.js";
import { db } from "../database/index.js";
import { llmCalls } from "../database/schema/index.js";

// Every call is logged with its estimated cost: the budget alarm (ADR-0010).
export const logCall = async (values: typeof llmCalls.$inferInsert) =>
  (await db.insert(llmCalls).values(values).returning({ id: llmCalls.id }))[0].id;

export const spentThisMonthInr = async (now = new Date()) =>
  (await db.select({ inr: sumOf(llmCalls.estCostInr) }).from(llmCalls).where(gte(llmCalls.createdAt, startOfIstMonth(now))))[0].inr;
