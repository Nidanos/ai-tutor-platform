import { type Options, rateLimit } from "express-rate-limit";
import { AppError } from "../errors/app-error.js";

const MINUTE = 60_000;

// In-memory counters: right for one API process. Switch to a Redis store when running several.
const limiter = (windowMs: number, limit: number, extra: Partial<Options> = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError(429, "RATE_LIMITED", "Too many attempts, try again later")),
    ...extra,
  });

export const loginByIp = limiter(15 * MINUTE, 20);
export const registerByIp = limiter(60 * MINUTE, 5);
export const refreshByIp = limiter(MINUTE, 30);

// Counts only failed logins for one email: slows guessing one person's password. Throttles, never locks.
export const loginFailuresByEmail = limiter(15 * MINUTE, 5, {
  keyGenerator: (req) => String(req.body?.email ?? "").toLowerCase(),
  skipSuccessfulRequests: true,
});

// Every run costs sandbox time: cap it per learner. Runs after authenticate, so req.auth is set.
export const submissionsByUser = limiter(MINUTE, 10, { keyGenerator: (req) => req.auth!.userId });

// The placement test: about one answer a minute is normal, so 30 a minute only stops scripts.
export const diagnosticByUser = limiter(MINUTE, 30, { keyGenerator: (req) => req.auth!.userId });

// Each live hint costs money and the ladder only goes up: 10 a minute is plenty for a person.
export const hintsByUser = limiter(MINUTE, 10, { keyGenerator: (req) => req.auth!.userId });

// Reset emails cost money: few requests per IP. Each account also gets at most one email per 5 minutes (M1 service).
export const forgotByIp = limiter(15 * MINUTE, 5);
export const resetByIp = limiter(15 * MINUTE, 10);
