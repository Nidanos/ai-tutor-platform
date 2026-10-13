import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

const READ_ONLY = new Set(["GET", "HEAD", "OPTIONS"]);

// CSRF guard: browsers attach cookies automatically, so a cookie-carrying write must come
// from our own web app. Bearer requests (mobile) carry no cookies and can't be forged this way.
export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (READ_ONLY.has(req.method) || !req.headers.cookie || req.headers.origin === env.WEB_ORIGIN) return next();
  throw new AppError(403, "BAD_ORIGIN", "Request blocked: unexpected origin");
};
