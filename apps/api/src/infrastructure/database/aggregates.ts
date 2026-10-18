import { type AnyColumn, type SQL, sql } from "drizzle-orm";

// Aggregate helpers for M13's counts. Postgres returns these as strings; mapWith makes them numbers.
export const countWhere = (condition: SQL) => sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
export const sumOf = (column: AnyColumn) => sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number);
