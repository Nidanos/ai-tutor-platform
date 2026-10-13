import { sql } from "drizzle-orm";
import { type AnyPgColumn, check, index, inet, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { citext, createdAt, id, timestamps, tz } from "./columns.js";

export const orgKind = pgEnum("org_kind", ["personal", "institution"]);
export const userRole = pgEnum("user_role", ["LEARNER", "AUTHOR", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["active", "disabled"]);
export const clientKind = pgEnum("client_kind", ["web", "mobile"]);

// Every learner belongs to one; sign-up creates a hidden "personal" one, colleges become "institution".
export const organizations = pgTable("organizations", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  kind: orgKind().notNull().default("personal"),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    orgId: uuid().notNull().references(() => organizations.id),
    email: citext().notNull().unique(),
    displayName: text().notNull(),
    role: userRole().notNull().default("LEARNER"),
    passwordHash: text().notNull(),
    timezone: text().notNull().default("Asia/Kolkata"),
    status: userStatus().notNull().default("active"),
    emailVerifiedAt: tz(),
    lastLoginAt: tz(),
    ...timestamps,
  },
  (t) => [
    index().on(t.orgId),
    check("users_display_name_length", sql`char_length(${t.displayName}) between 1 and 80`),
  ],
);

// Tokens from one login share a familyId, so reuse of a stolen token can revoke them all.
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: id(),
    userId: uuid().notNull().references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid().notNull(),
    tokenHash: text().notNull().unique("refresh_tokens_token_hash_unique"),
    replacedById: uuid().references((): AnyPgColumn => refreshTokens.id, { onDelete: "set null" }),
    client: clientKind().notNull(),
    userAgent: text(),
    ip: inet(),
    expiresAt: tz().notNull(),
    revokedAt: tz(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId), index().on(t.familyId)],
);
