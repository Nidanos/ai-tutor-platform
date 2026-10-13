import type { RequestHandler } from "express";
import { errors } from "jose";
import { ACCESS_COOKIE } from "../auth/cookies.js";
import { type AuthUser, verifyAccessToken } from "../auth/tokens.js";
import { AppError } from "../errors/app-error.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

// Mobile sends a Bearer header, the web app sends the httpOnly cookie: one check for both.
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.[ACCESS_COOKIE];
  if (!token) throw new AppError(401, "UNAUTHENTICATED", "Please log in");

  try {
    req.auth = await verifyAccessToken(token);
  } catch (err) {
    // A separate code tells the client to refresh silently instead of showing the login page.
    if (err instanceof errors.JWTExpired) throw new AppError(401, "TOKEN_EXPIRED", "Session expired");
    throw new AppError(401, "UNAUTHENTICATED", "Please log in");
  }
  next();
};
