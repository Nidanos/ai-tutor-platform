import { z } from "zod";
import { displayName } from "./auth.schemas.js";

// Intl knows every IANA zone, and throws on anything else.
function isTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

// Correction (DPDP s.12): the fields a learner may change themselves.
export const updateMeBody = z
  .object({ displayName, timezone: z.string().max(64).refine(isTimeZone, "Unknown time zone") })
  .partial()
  .refine((b) => b.displayName !== undefined || b.timezone !== undefined, "Send displayName or timezone");

export type ProfileInput = z.infer<typeof updateMeBody>;

// Only the optional opt-ins switch on and off. The required consents end with the account (DELETE /me).
export const optInParams = z.object({
  kind: z.enum(["ai_training", "research_study"], {
    error: "Only ai_training and research_study can be switched off; the others end when the account is deleted",
  }),
});

export const deleteMeBody = z.object({ password: z.string().min(1).max(128) });
