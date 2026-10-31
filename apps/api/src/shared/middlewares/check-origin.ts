import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

const READ_ONLY = new Set(["GET", "HEAD", "OPTIONS"]);
// A local web app proxying to this API holds its own localhost cookies: the site's cookies are SameSite,
// so a page on localhost can never send a learner's, and allowing it opens nothing to other sites.
const OWN_ORIGINS = new Set([env.WEB_ORIGIN, env.DEV_WEB_ORIGIN].filter(Boolean));

// CSRF guard: browsers attach cookies automatically, so a cookie-carrying write must come
// from our own web app. Bearer requests (mobile) carry no cookies and can't be forged this way.
export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (READ_ONLY.has(req.method) || !req.headers.cookie || OWN_ORIGINS.has(req.headers.origin ?? "")) return next();
  throw new AppError(403, "BAD_ORIGIN", "Request blocked: unexpected origin");
};
