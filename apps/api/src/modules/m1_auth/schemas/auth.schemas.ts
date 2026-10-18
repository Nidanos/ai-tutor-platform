import { z } from "zod";
import { isAdult } from "../services/age.js";

const email = z.email().max(254);
const today = () => new Date().toISOString().slice(0, 10);
const mustAccept = (doc: string) => z.literal(true, { error: `You must accept the ${doc}` });

// NIST rules: length matters, forced symbols don't. The 128 cap stops huge strings being hashed.
// Unknown fields (like "role") are stripped, so nobody can sign up as ADMIN.
const newPassword = z.string().min(8).max(128);

export const registerBody = z
  .object({
    email,
    password: newPassword,
    displayName: z.string().trim().min(1).max(80),
    dateOfBirth: z.iso.date().refine((d) => d >= "1900-01-01" && d <= today(), "Enter a real date of birth"),
    acceptTerms: mustAccept("Terms of Service"),
    acceptPrivacy: mustAccept("Privacy Policy"),
    // Optional, off by default, adults only (DOCS/legal/privacy-policy.md, section 3).
    aiTraining: z.boolean().default(false),
    research: z.boolean().default(false),
  })
  .refine((b) => isAdult(b.dateOfBirth) || !(b.aiTraining || b.research), {
    message: "Only adults can opt in to AI training or research",
    path: ["aiTraining"],
  });

export type RegisterInput = z.infer<typeof registerBody>;

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(128),
  client: z.enum(["web", "mobile"]).default("web"),
});

// Mobile sends the refresh token in the body; the web app sends it as a cookie.
export const tokenBody = z.object({ refreshToken: z.string().max(200).optional() });

export const forgotPasswordBody = z.object({ email });
export const resetPasswordBody = z.object({ token: z.string().min(20).max(200), password: newPassword });
