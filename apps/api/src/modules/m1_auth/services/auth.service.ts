import { v7 as uuidv7 } from "uuid";
import { env } from "../../../config/env.js";
import { isUniqueViolation } from "../../../infrastructure/database/errors.js";
import { sendMail } from "../../../infrastructure/mail/mailer.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../../../shared/auth/password.js";
import {
  type AuthUser,
  newRefreshToken,
  randomToken,
  REFRESH_TTL_DAYS,
  sha256,
  signAccessToken,
} from "../../../shared/auth/tokens.js";
import { AppError } from "../../../shared/errors/app-error.js";
import * as repo from "../repositories/auth.repository.js";
import type { RegisterInput } from "../schemas/auth.schemas.js";
import { resetEmail } from "./reset-email.js";

type Client = "web" | "mobile";
type Device = { userAgent?: string; ip?: string };

// When two tabs refresh at once, the second shows a just-replaced token: allow that briefly.
const REUSE_GRACE_MS = 20_000;
const RESET_LINK_MINUTES = 30; // ADR-0017
const RESET_EMAIL_GAP_MINUTES = 5; // at most one reset email per account in this time
// The DOCS/legal version users agree to. Bump it when the Privacy Policy or Terms change.
export const LEGAL_VERSION = "0.1";

const invalidCredentials = () => new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
export const loginAgain = () => new AppError(401, "UNAUTHENTICATED", "Please log in again");

// Sign-up is for adults (the schema refuses under-18s for the pilot), so the account starts active.
export async function register({ email, password, displayName, dateOfBirth, aiTraining, research }: RegisterInput) {
  const consentKinds: repo.ConsentKind[] = ["data_processing", "terms"];
  if (aiTraining) consentKinds.push("ai_training");
  if (research) consentKinds.push("research_study");

  const passwordHash = await hashPassword(password);
  try {
    return await repo.createLearner({ email, passwordHash, displayName, dateOfBirth }, consentKinds, LEGAL_VERSION);
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, "EMAIL_TAKEN", "This email is already registered");
    throw err;
  }
}

// Same error and same timing for a wrong email and a wrong password: no account discovery.
export async function login(input: { email: string; password: string }, client: Client, device: Device) {
  const user = await repo.findUserByEmail(input.email);
  const valid = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, input.password);
  if (!user || !valid) throw invalidCredentials();
  if (user.status === "pending_parent") {
    throw new AppError(403, "PARENT_APPROVAL_PENDING", "A parent or guardian needs to approve this account first");
  }
  if (user.status !== "active") throw invalidCredentials();

  if (!(await repo.markLoggedIn(user.id))) throw invalidCredentials();
  return issueSession({ userId: user.id, role: user.role, orgId: user.orgId }, uuidv7(), client, device, user.sessionVersion);
}

// Rotation: every refresh replaces the token. An old token coming back means it was copied,
// so the whole login (family) is revoked. So is any login of an account waiting to be deleted, and one
// issued before the latest password reset (even if it was saved just after it).
export async function refresh(token: string | undefined, device: Device) {
  const found = token && (await repo.findRefreshToken(sha256(token)));
  if (!found || found.token.expiresAt < new Date()) throw loginAgain();

  const { token: row, user } = found;
  const inGrace = row.replacedById && row.revokedAt && Date.now() - row.revokedAt.getTime() < REUSE_GRACE_MS;
  const staleSession = row.sessionVersion !== user.sessionVersion;
  if ((row.revokedAt && !inGrace) || staleSession || user.status !== "active" || user.deletionRequestedAt) {
    await repo.revokeFamily(row.familyId);
    throw loginAgain();
  }

  const session = await issueSession({ userId: user.id, role: user.role, orgId: user.orgId }, row.familyId, row.client, device, row.sessionVersion);
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

async function issueSession(user: AuthUser, familyId: string, client: Client, device: Device, sessionVersion: number) {
  const refreshToken = newRefreshToken();
  const refreshTokenId = await repo.insertRefreshToken({
    userId: user.userId,
    familyId,
    tokenHash: sha256(refreshToken),
    client,
    ...device,
    expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000),
    sessionVersion,
  });
  return { accessToken: await signAccessToken(user), refreshToken, refreshTokenId, client };
}

// For M13: learner counts and research opt-ins.
export const learnerStats = repo.learnerStats;

// POST /auth/forgot-password (ADR-0017). All the work happens after the reply, which is the same for
// every email, so neither the reply nor its timing says whether an account exists.
export function forgotPassword(email: string) {
  void sendResetLink(email).catch((err) => console.error("Password reset link failed", err));
}

async function sendResetLink(email: string) {
  const user = await repo.findUserByEmail(email);
  if (!user || user.status !== "active") return;
  const token = randomToken();
  const now = Date.now();
  // Asking again within the gap sends nothing: the recent link still works. That caps the emails one
  // inbox can get without a per-email limit that anyone could fill to lock its owner out.
  const created = await repo.createResetToken(user.id, sha256(token), new Date(now + RESET_LINK_MINUTES * 60_000), new Date(now - RESET_EMAIL_GAP_MINUTES * 60_000));
  if (!created) return;
  // The token travels in the #fragment, which browsers never send to a server or put in a Referer header.
  const link = `${env.WEB_ORIGIN}/reset-password#token=${token}`;
  await sendMail({ to: user.email, ...resetEmail(link, RESET_LINK_MINUTES) });
}

// POST /auth/reset-password: a live link sets the new password and logs the account out everywhere.
export async function resetPassword(token: string, password: string) {
  const invalid = () => new AppError(400, "RESET_LINK_INVALID", "This reset link is invalid or has expired. Ask for a new one.");
  const found = await repo.findLiveResetToken(sha256(token));
  if (!found) throw invalid();
  if (!(await repo.resetPassword(found.id, found.userId, await hashPassword(password)))) throw invalid();
}
