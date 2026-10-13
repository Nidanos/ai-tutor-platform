import { sql } from "drizzle-orm";
import { type AnyPgColumn, bigint, check, customType, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

// UUIDv7 is time-ordered (index-friendly) and made by the app, so the id is known before insert.
export const id = () => uuid().primaryKey().$defaultFn(uuidv7);

// Append-only logs just count up.
export const logId = () => bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity();

export const tz = () => timestamp({ withTimezone: true });
export const createdAt = () => tz().notNull().defaultNow();
export const timestamps = {
  createdAt: createdAt(),
  updatedAt: tz().notNull().defaultNow().$onUpdate(() => new Date()),
};

// Case-insensitive text (needs the citext extension, migration 0000).
export const citext = customType<{ data: string }>({ dataType: () => "citext" });

// CHECK min <= column <= max (scores 0–1, rungs 1–5, hint levels 0–5...).
export const inRange = (name: string, column: AnyPgColumn, min: number, max: number) =>
  check(name, sql`${column} between ${sql.raw(String(min))} and ${sql.raw(String(max))}`);
