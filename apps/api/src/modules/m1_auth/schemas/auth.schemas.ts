import { z } from "zod";
import { isAdult } from "../services/age.js";

const email = z.email().max(254);
const today = () => new Date().toISOString().slice(0, 10);
const mustAccept = (doc: string) => z.literal(true, { error: `You must accept the ${doc}` });

// NIST rules: length matters, forced symbols don't. The 128 cap stops huge strings being hashed.
// Unknown fields (like "role") are stripped, so nobody can sign up as ADMIN.
const newPassword = z.string().min(8).max(128);
export const displayName = z.string().trim().min(1).max(80);

export const registerBody = z
  .object({
    // .invalid is reserved (RFC 2606): erased accounts use it, so a sign-up taking one could block an erasure.
    email: email.refine((e) => !e.toLowerCase().endsWith(".invalid"), "Enter a real email address"),
    password: newPassword,
    displayName,
    dateOfBirth: z.iso
      .date()
      .refine((d) => d >= "1900-01-01" && d <= today(), { error: "Enter a real date of birth", abort: true })
      // The pilot is for adults: a child's account needs a parent's approval first (DPDP s.9), and that flow isn't built.
      .refine(isAdult, "AI-Tutor is open to adults (18 and over) for now"),
    acceptTerms: mustAccept("Terms of Service"),
    acceptPrivacy: mustAccept("Privacy Policy"),
    // Optional, off by default (DOCS/legal/privacy-policy.md, section 3).
    aiTraining: z.boolean().default(false),
    research: z.boolean().default(false),
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
