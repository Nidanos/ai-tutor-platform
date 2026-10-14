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
    REDIS_URL: z.url().default("redis://localhost:6379"), // the submissions queue
    E2B_API_KEY: z.string().optional(), // only needed to run learner code (ADR-0003)
  })
  .parse(process.env);
