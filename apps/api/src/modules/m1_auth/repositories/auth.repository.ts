import { and, eq, isNull } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import { db } from "../../../infrastructure/database/index.js";
import { organizations, refreshTokens, users } from "../../../infrastructure/database/schema/index.js";

// What clients may see of a user. Never the password hash.
const publicUser = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  role: users.role,
  timezone: users.timezone,
  createdAt: users.createdAt,
};

// A learner always gets their own hidden personal organisation, in the same transaction.
export const createLearner = (email: string, passwordHash: string, displayName: string) =>
  db.transaction(async (tx) => {
    const orgId = uuidv7();
    await tx.insert(organizations).values({ id: orgId, name: displayName, slug: orgId });
    const [user] = await tx.insert(users).values({ orgId, email, passwordHash, displayName }).returning(publicUser);
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
