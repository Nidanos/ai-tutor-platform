import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../../config/env.js";

const digest = (value: string) => createHash("sha256").update(value).digest();
const SECRET = env.ORIGIN_SECRET ? digest(env.ORIGIN_SECRET) : undefined;

// Client IP behind Vercel and Render (ADR-0024). Vercel replaces X-Forwarded-For with the visitor's IP and adds
// our secret; Render's proxy then appends its own hop. With the right secret only that first entry is kept, so
// req.ip is the visitor. Without it the header is left alone, and trust proxy stops a caller choosing its IP.
export const vercelVisitor: RequestHandler = (req, _res, next) => {
  const sent = req.headers["x-origin-secret"];
  delete req.headers["x-origin-secret"];
  if (SECRET && typeof sent === "string" && timingSafeEqual(digest(sent), SECRET)) {
    const visitor = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    if (visitor) req.headers["x-forwarded-for"] = visitor;
  }
  next();
};
