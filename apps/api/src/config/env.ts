import { existsSync } from "node:fs";
import { z } from "zod";

// Local dev reads .env; in production the host provides real environment variables.
if (existsSync(".env")) process.loadEnvFile();

export const env = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string().min(32),
    WEB_ORIGIN: z.url(), // the only origin allowed to send cookie-authenticated writes
    ORIGIN_SECRET: z.string().min(32).optional(), // Vercel sends it with /api requests: then its X-Forwarded-For is the visitor (ADR-0024)
    REDIS_URL: z.url().default("redis://localhost:6379"), // the submissions queue
    E2B_API_KEY: z.string().optional(), // only needed to run learner code (ADR-0003)
    GEMINI_API_KEY: z.string().optional(), // live hints and generation; without it hints fall back to frozen ones
    // Set "true" only once billing is active: free-tier prompts may be used by Google, and prompts carry learner code.
    GEMINI_PAID: z.enum(["true", "false"]).default("false"),
    BREVO_API_KEY: z.string().optional(), // password-reset emails; without it they are printed (required in production)
    MAIL_FROM: z.email().default("no-reply@nidanos.com"), // must be a sender verified in Brevo
  })
  .refine((e) => e.NODE_ENV !== "production" || !!e.BREVO_API_KEY, { error: "BREVO_API_KEY is required in production", path: ["BREVO_API_KEY"] })
  // Without it every web learner would share Vercel's addresses, and so each per-IP limit.
  .refine((e) => e.NODE_ENV !== "production" || !!e.ORIGIN_SECRET, { error: "ORIGIN_SECRET is required in production", path: ["ORIGIN_SECRET"] })
  .parse(process.env);
