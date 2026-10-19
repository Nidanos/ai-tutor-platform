import { sendMail } from "../../../infrastructure/mail/mailer.js";
import { verifyPassword } from "../../../shared/auth/password.js";
import type { AuthUser } from "../../../shared/auth/tokens.js";
import { AppError } from "../../../shared/errors/app-error.js";
import * as repo from "../repositories/account.repository.js";
import type { ConsentKind } from "../repositories/auth.repository.js";
import type { ProfileInput } from "../schemas/account.schemas.js";
import { isAdult } from "./age.js";
import { LEGAL_VERSION, loginAgain, me } from "./auth.service.js";
import { deletionEmail } from "./deletion-email.js";
import { DELETION_GRACE_DAYS } from "./erasure.service.js";

// PATCH /me. Only an account that can still use the app changes.
export async function updateProfile({ userId, orgId }: AuthUser, profile: ProfileInput) {
  const user = await repo.updateProfile(userId, orgId, profile);
  if (!user) throw loginAgain();
  return user;
}

export const listConsents = repo.liveConsents;

// The optional opt-ins are for adults only (privacy policy §3), and switch on and off as often as the learner likes.
export async function optIn(userId: string, kind: ConsentKind) {
  const { dateOfBirth } = await me(userId);
  if (!dateOfBirth || !isAdult(dateOfBirth)) {
    throw new AppError(403, "ADULTS_ONLY", "Only adults can opt in to AI training or research");
  }
  await repo.grantConsent(userId, kind, LEGAL_VERSION);
}

export const optOut = repo.revokeConsent;

// DELETE /me. The password again, so an open laptop alone can't delete the account. Every login ends;
// the hourly job erases the account once the grace period is over, unless the learner logs in first.
export async function requestDeletion(userId: string, password: string) {
  const user = await repo.findUser(userId);
  if (!user || user.status !== "active") throw loginAgain();
  if (!(await verifyPassword(user.passwordHash, password))) throw new AppError(403, "WRONG_PASSWORD", "That password isn't right");
  await repo.markForDeletion(userId);
  const eraseAfter = new Date(Date.now() + DELETION_GRACE_DAYS * 86_400_000);
  void sendMail({ to: user.email, ...deletionEmail(eraseAfter, user.timezone) }).catch((err) => console.error("Deletion email failed", err));
  return { eraseAfter };
}
