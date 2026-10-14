import { sql } from "drizzle-orm";
import { type AnyPgColumn, check, date, index, inet, pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { citext, createdAt, id, timestamps, tz } from "./columns.js";

export const orgKind = pgEnum("org_kind", ["personal", "institution"]);
export const userRole = pgEnum("user_role", ["LEARNER", "AUTHOR", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["active", "disabled", "pending_parent"]);
export const clientKind = pgEnum("client_kind", ["web", "mobile"]);
// data_processing and terms are required at sign-up; parental unlocks a minor; the rest are optional opt-ins (DOCS/legal).
export const consentKind = pgEnum("consent_kind", ["research_study", "data_processing", "terms", "parental", "ai_training"]);

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
    dateOfBirth: date({ mode: "string" }), // required at sign-up; null only for accounts made before it
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

// Proof of what each user agreed to, and to which policy version. Kept after account deletion (DPDP).
export const consents = pgTable(
  "consents",
  {
    id: id(),
    userId: uuid().notNull().references(() => users.id),
    kind: consentKind().notNull(),
    policyVersion: text().notNull(),
    grantedAt: tz().notNull().defaultNow(),
    revokedAt: tz(),
  },
  (t) => [uniqueIndex("consents_one_live").on(t.userId, t.kind).where(sql`${t.revokedAt} is null`)],
);
