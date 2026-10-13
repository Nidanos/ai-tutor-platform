import { v7 as uuidv7 } from "uuid";
import { isUniqueViolation } from "../../../infrastructure/database/errors.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../../../shared/auth/password.js";
import {
  type AuthUser,
  newRefreshToken,
  REFRESH_TTL_DAYS,
  sha256,
  signAccessToken,
} from "../../../shared/auth/tokens.js";
import { AppError } from "../../../shared/errors/app-error.js";
import * as repo from "../repositories/auth.repository.js";

type Client = "web" | "mobile";
type Device = { userAgent?: string; ip?: string };

// When two tabs refresh at once, the second shows a just-replaced token: allow that briefly.
const REUSE_GRACE_MS = 20_000;

const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
const loginAgain = () => new AppError(401, "UNAUTHENTICATED", "Please log in again");

export async function register(input: { email: string; password: string; displayName: string }) {
  try {
    return await repo.createLearner(input.email, await hashPassword(input.password), input.displayName);
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, "EMAIL_TAKEN", "This email is already registered");
    throw err;
  }
}

// Same error and same timing for a wrong email and a wrong password: no account discovery.
export async function login(input: { email: string; password: string }, client: Client, device: Device) {
  const user = await repo.findUserByEmail(input.email);
  const valid = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, input.password);
  if (!user || !valid || user.status !== "active") throw invalidCredentials();

  await repo.markLoggedIn(user.id);
  return issueSession({ userId: user.id, role: user.role, orgId: user.orgId }, uuidv7(), client, device);
}

// Rotation: every refresh replaces the token. An old token coming back means it was copied,
// so the whole login (family) is revoked.
export async function refresh(token: string | undefined, device: Device) {
  const found = token && (await repo.findRefreshToken(sha256(token)));
  if (!found || found.token.expiresAt < new Date()) throw loginAgain();

  const { token: row, user } = found;
  const inGrace = row.replacedById && row.revokedAt && Date.now() - row.revokedAt.getTime() < REUSE_GRACE_MS;
  if ((row.revokedAt && !inGrace) || user.status !== "active") {
    await repo.revokeFamily(row.familyId);
    throw loginAgain();
  }

  const session = await issueSession({ userId: user.id, role: user.role, orgId: user.orgId }, row.familyId, row.client, device);
  await repo.markReplaced(row.id, session.refreshTokenId);
  return session;
}

export async function logout(token: string | undefined) {
  const found = token && (await repo.findRefreshToken(sha256(token)));
  if (found) await repo.revokeFamily(found.token.familyId);
}

export async function me(userId: string) {
  const user = await repo.findActiveUser(userId);
  if (!user) throw loginAgain();
  return user;
}

async function issueSession(user: AuthUser, familyId: string, client: Client, device: Device) {
  const refreshToken = newRefreshToken();
  const refreshTokenId = await repo.insertRefreshToken({
    userId: user.userId,
    familyId,
    tokenHash: sha256(refreshToken),
    client,
    ...device,
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000),
  });
  return { accessToken: await signAccessToken(user), refreshToken, refreshTokenId, client };
}
