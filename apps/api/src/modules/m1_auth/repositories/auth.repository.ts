import { and, eq, gt, gte, isNull, ne, sql } from "drizzle-orm";
import { countWhere } from "../../../infrastructure/database/aggregates.js";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../../infrastructure/database/index.js";
import { consents, organizations, passwordResetTokens, refreshTokens, users } from "../../../infrastructure/database/schema/index.js";

// What clients may see of a user. Never the password hash.
export const publicUser = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  role: users.role,
  timezone: users.timezone,
  dateOfBirth: users.dateOfBirth,
  status: users.status,
  createdAt: users.createdAt,
};

export type ConsentKind = (typeof consents.$inferInsert)["kind"];
type NewLearner = Pick<typeof users.$inferInsert, "email" | "passwordHash" | "displayName" | "dateOfBirth" | "status">;

// The user, their hidden personal organisation and their consents are saved together or not at all.
export const createLearner = (learner: NewLearner, consentKinds: ConsentKind[], policyVersion: string) =>
  db.transaction(async (tx) => {
    const orgId = uuidv7();
    await tx.insert(organizations).values({ id: orgId, name: learner.displayName, slug: orgId });
    const [user] = await tx.insert(users).values({ orgId, ...learner }).returning(publicUser);
    if (consentKinds.length) {
      await tx.insert(consents).values(consentKinds.map((kind) => ({ userId: user.id, kind, policyVersion })));
    }
    return user;
  });

export const findUserByEmail = async (email: string) =>
  (await db.select().from(users).where(eq(users.email, email)))[0];

// Can use the app: active, with no deletion pending (DELETE /me ends every login until the next one).
export const usableAccount = and(eq(users.status, "active"), isNull(users.deletionRequestedAt));

export const findActiveUser = async (id: string) =>
  (await db.select(publicUser).from(users).where(and(eq(users.id, id), usableAccount)))[0];

// Logging in also cancels a pending account deletion (DELETE /me). False if the account was erased
// after the login read it: the hourly job won that race.
export const markLoggedIn = async (id: string) =>
  (
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), deletionRequestedAt: null })
      .where(and(eq(users.id, id), eq(users.status, "active")))
      .returning({ id: users.id })
  ).length > 0;

export const insertRefreshToken = async (values: typeof refreshTokens.$inferInsert) =>
  (await db.insert(refreshTokens).values(values).returning({ id: refreshTokens.id }))[0].id;

export const findRefreshToken = async (tokenHash: string) =>
  (
    await db
      .select({
        token: refreshTokens,
        user: { id: users.id, role: users.role, orgId: users.orgId, status: users.status, deletionRequestedAt: users.deletionRequestedAt, sessionVersion: users.sessionVersion },
      })
      .from(refreshTokens)
      .innerJoin(users, eq(users.id, refreshTokens.userId))
      .where(eq(refreshTokens.tokenHash, tokenHash))
  )[0];

export const markReplaced = (id: string, replacedById: string) =>
  db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), replacedById })
    .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.revokedAt)));

export const revokeFamily = (familyId: string) =>
  db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)));

// For M13: learner counts and live research opt-ins. Counts only, never who.
export async function learnerStats(since: Date) {
  const [counts] = await db
    .select({ total: countWhere(sql`true`), joined: countWhere(gte(users.createdAt, since)), pendingParent: countWhere(eq(users.status, "pending_parent")) })
    .from(users)
    .where(and(eq(users.role, "LEARNER"), ne(users.status, "deleted")));
  const [consented] = await db
    .select({ researchStudy: countWhere(eq(consents.kind, "research_study")), aiTraining: countWhere(eq(consents.kind, "ai_training")) })
    .from(consents)
    .where(isNull(consents.revokedAt));
  return { ...counts, consented };
}

// "Forgot password" (ADR-0017): false if a link was sent since `unlessSentSince`. Otherwise the new link
// replaces any unused one, so only the latest email works.
export const createResetToken = (userId: string, tokenHash: string, expiresAt: Date, unlessSentSince: Date) =>
  db.transaction(async (tx) => {
    const [recent] = await tx
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, userId), gt(passwordResetTokens.createdAt, unlessSentSince)))
      .limit(1);
    if (recent) return false;
    await tx.delete(passwordResetTokens).where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
    await tx.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
    return true;
  });

// A link that is unused, unexpired, and for an account that can still log in.
export const findLiveResetToken = async (tokenHash: string) =>
  (
    await db
      .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.id, passwordResetTokens.userId))
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
          eq(users.status, "active"),
        ),
      )
  )[0];

// The new password, the spent link and the end of every login, together: a session stolen with the
// old password dies with it. Other unused links go too (two requests at once can each make one).
// False if the link was just used (a double click: the first one won).
export const resetPassword = (tokenId: string, userId: string, passwordHash: string) =>
  db.transaction(async (tx) => {
    const [spent] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.id, tokenId), isNull(passwordResetTokens.usedAt)))
      .returning({ id: passwordResetTokens.id });
    if (!spent) return false;
    await tx.delete(passwordResetTokens).where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
    // A new version also ends a login or refresh that was under way and saves its token after this.
    await tx.update(users).set({ passwordHash, sessionVersion: sql`${users.sessionVersion} + 1` }).where(eq(users.id, userId));
    await tx.update(refreshTokens).set({ revokedAt: new Date() }).where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    return true;
  });
