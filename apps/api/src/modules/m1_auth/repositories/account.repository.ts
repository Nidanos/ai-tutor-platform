import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/index.js";
import { consents, organizations, passwordResetTokens, refreshTokens, users } from "../../../infrastructure/database/schema/index.js";
import type { ProfileInput } from "../schemas/account.schemas.js";
import { type ConsentKind, publicUser, usableAccount } from "./auth.repository.js";

// The hidden personal organisation carries the learner's name too (sign-up copies it), so it changes with it.
export const updateProfile = (userId: string, orgId: string, profile: ProfileInput) =>
  db.transaction(async (tx) => {
    const [user] = await tx.update(users).set(profile).where(and(eq(users.id, userId), usableAccount)).returning(publicUser);
    if (user && profile.displayName) {
      await tx
        .update(organizations)
        .set({ name: profile.displayName })
        .where(and(eq(organizations.id, orgId), eq(organizations.kind, "personal")));
    }
    return user;
  });

export const liveConsents = (userId: string) =>
  db
    .select({ kind: consents.kind, policyVersion: consents.policyVersion, grantedAt: consents.grantedAt })
    .from(consents)
    .where(and(eq(consents.userId, userId), isNull(consents.revokedAt)))
    .orderBy(consents.grantedAt);

// One live row per kind (consents_one_live): granting again keeps the first grant.
export const grantConsent = (userId: string, kind: ConsentKind, policyVersion: string) =>
  db.insert(consents).values({ userId, kind, policyVersion }).onConflictDoNothing();

// Revoked rows stay: they prove what was agreed, and when it ended.
export const revokeConsent = (userId: string, kind: ConsentKind) =>
  db
    .update(consents)
    .set({ revokedAt: new Date() })
    .where(and(eq(consents.userId, userId), eq(consents.kind, kind), isNull(consents.revokedAt)));

// For GET /me/data: the account, every consent given or withdrawn, and the sign-in records. Never a hash.
export async function accountData(userId: string) {
  const [[profile], consentRows, logins, passwordResets] = await Promise.all([
    db.select({ ...publicUser, emailVerifiedAt: users.emailVerifiedAt, lastLoginAt: users.lastLoginAt }).from(users).where(eq(users.id, userId)),
    db
      .select({ kind: consents.kind, policyVersion: consents.policyVersion, grantedAt: consents.grantedAt, revokedAt: consents.revokedAt })
      .from(consents)
      .where(eq(consents.userId, userId)),
    db
      .select({
        client: refreshTokens.client,
        userAgent: refreshTokens.userAgent,
        ip: refreshTokens.ip,
        createdAt: refreshTokens.createdAt,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, userId)),
    db
      .select({ requestedAt: passwordResetTokens.createdAt, expiresAt: passwordResetTokens.expiresAt, usedAt: passwordResetTokens.usedAt })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId)),
  ]);
  return { profile, consents: consentRows, logins, passwordResets };
}

export const findUser = async (id: string) => (await db.select().from(users).where(eq(users.id, id)))[0];

// DELETE /me: the request is noted and every login ends. Logging in again before erasure cancels it.
export const markForDeletion = (userId: string) =>
  db.transaction(async (tx) => {
    await tx.update(users).set({ deletionRequestedAt: new Date() }).where(eq(users.id, userId));
    await tx.update(refreshTokens).set({ revokedAt: new Date() }).where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  });

export const dueForErasure = (requestedBefore: Date) =>
  db.select({ id: users.id }).from(users).where(lte(users.deletionRequestedAt, requestedBefore));

const OPT_INS: ConsentKind[] = ["ai_training", "research_study"];

export const hasOptIn = async (userId: string) =>
  (
    await db
      .select({ id: consents.id })
      .from(consents)
      .where(and(eq(consents.userId, userId), isNull(consents.revokedAt), inArray(consents.kind, OPT_INS)))
      .limit(1)
  ).length > 0;

const DELETED_NAME = "Deleted learner";

// Erasure, first step: nothing left names the person, and nobody can log in. Only while the request
// still stands (logging in clears it). Run again after a failure, it changes nothing new.
// Sign-in records (refresh and reset tokens: times, IP, device) stay a year under the anonymous ID, as
// the DPDP Rules ask of security logs; the security-log job deletes them (DPDP doc §4).
export const closeAccount = (userId: string, requestedBefore: Date, unusableHash: string) =>
  db.transaction(async (tx) => {
    const [user] = await tx
      .update(users)
      .set({
        email: `deleted-${userId}@deleted.invalid`,
        displayName: DELETED_NAME,
        passwordHash: unusableHash,
        dateOfBirth: null,
        timezone: sql`default`,
        emailVerifiedAt: null,
        lastLoginAt: null,
        status: "deleted",
      })
      .where(and(eq(users.id, userId), lte(users.deletionRequestedAt, requestedBefore)))
      .returning({ orgId: users.orgId });
    if (!user) return false;
    await tx.update(organizations).set({ name: DELETED_NAME }).where(and(eq(organizations.id, user.orgId), eq(organizations.kind, "personal")));
    await tx.update(refreshTokens).set({ revokedAt: new Date() }).where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    return true;
  });

// Erasure, last step: consents end but stay as proof, under the anonymous ID; the request is done.
export const finishErasure = (userId: string) =>
  db.transaction(async (tx) => {
    await tx.update(consents).set({ revokedAt: new Date() }).where(and(eq(consents.userId, userId), isNull(consents.revokedAt)));
    await tx.update(users).set({ deletionRequestedAt: null }).where(eq(users.id, userId));
  });
