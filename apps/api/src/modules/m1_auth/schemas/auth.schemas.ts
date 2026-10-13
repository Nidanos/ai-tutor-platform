import { z } from "zod";

const email = z.email().max(254);

// NIST rules: length matters, forced symbols don't. The 128 cap stops huge strings being hashed.
// Unknown fields (like "role") are stripped, so nobody can sign up as ADMIN.
export const registerBody = z.object({
  email,
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(80),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(128),
  client: z.enum(["web", "mobile"]).default("web"),
});

// Mobile sends the refresh token in the body; the web app sends it as a cookie.
export const tokenBody = z.object({ refreshToken: z.string().max(200).optional() });
