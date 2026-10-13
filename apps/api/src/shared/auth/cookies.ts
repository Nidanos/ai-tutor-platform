import type { CookieOptions, Response } from "express";
import { env } from "../../config/env.js";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_DAYS } from "./tokens.js";

export const ACCESS_COOKIE = "at";
export const REFRESH_COOKIE = "rt";

// httpOnly: page scripts can't read tokens (XSS). The refresh cookie is only ever sent to /auth.
const base: CookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax" };
const access: CookieOptions = { ...base, path: "/api" };
const refresh: CookieOptions = { ...base, sameSite: "strict", path: "/api/v1/auth" };

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...access, maxAge: ACCESS_TTL_SECONDS * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...refresh, maxAge: REFRESH_TTL_DAYS * 86_400_000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, access);
  res.clearCookie(REFRESH_COOKIE, refresh);
}
