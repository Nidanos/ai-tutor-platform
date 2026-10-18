import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { countWhere } from "../../../infrastructure/database/aggregates.js";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../../infrastructure/database/index.js";
import { consents, organizations, refreshTokens, users } from "../../../infrastructure/database/schema/index.js";

// What clients may see of a user. Never the password hash.
const publicUser = {
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

export const findActiveUser = async (id: string) =>
  (await db.select(publicUser).from(users).where(and(eq(users.id, id), eq(users.status, "active"))))[0];

export const markLoggedIn = (id: string) => db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));

export const insertRefreshToken = async (values: typeof refreshTokens.$inferInsert) =>
  (await db.insert(refreshTokens).values(values).returning({ id: refreshTokens.id }))[0].id;

export const findRefreshToken = async (tokenHash: string) =>
  (
    await db
      .select({
        token: refreshTokens,
        user: { id: users.id, role: users.role, orgId: users.orgId, status: users.status },
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
    .where(eq(users.role, "LEARNER"));
  const [consented] = await db
    .select({ researchStudy: countWhere(eq(consents.kind, "research_study")), aiTraining: countWhere(eq(consents.kind, "ai_training")) })
    .from(consents)
    .where(isNull(consents.revokedAt));
  return { ...counts, consented };
}
