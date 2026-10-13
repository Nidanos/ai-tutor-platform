import { createHash, randomBytes } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { env } from "../../config/env.js";
import type { users } from "../../infrastructure/database/schema/index.js";

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_DAYS = 30;

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ISSUER = "ai-tutor-api";

export type AuthUser = { userId: string; role: (typeof users.$inferSelect)["role"]; orgId: string };

// Access token: short-lived and never stored. Checking it needs no database read.
export const signAccessToken = ({ userId, role, orgId }: AuthUser) =>
  new SignJWT({ role, org: orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret);

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
  return { userId: payload.sub!, role: payload.role as AuthUser["role"], orgId: payload.org as string };
}

// Refresh token: 32 random bytes. Only its SHA-256 is stored; random tokens need no slow hash.
export const newRefreshToken = () => randomBytes(32).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
