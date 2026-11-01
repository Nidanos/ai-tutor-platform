import { ApiError, api } from "@/lib/api/client";
import type { AuthUser, Consent, ConsentKind } from "@ai-tutor/types";

// The two optional uses a learner can switch on and off; the others are recorded at sign-up.
export type OptInKind = Extract<ConsentKind, "ai_training" | "research_study">;

/** Read or update the authenticated user's own profile. Ownership is enforced by the API. */
export function updateProfile(input: { displayName?: string; timezone?: string }) {
  return api<{ user: AuthUser }>("/me", { method: "PATCH", body: JSON.stringify(input) });
}

export function getConsents() {
  return api<{ consents: Consent[] }>("/me/consents");
}

export function grantConsent(kind: OptInKind) {
  return api<void>(`/me/consents/${kind}`, { method: "PUT" });
}

export function revokeConsent(kind: OptInKind) {
  return api<void>(`/me/consents/${kind}`, { method: "DELETE" });
}

/**
 * The data-export endpoint deliberately returns a JSON file, not the usual API envelope.
 * Refresh the authenticated session first, then download the raw response as documented.
 */
export async function downloadMyData(): Promise<void> {
  await api<{ user: AuthUser }>("/auth/me");
  const response = await fetch("/api/v1/me/data", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    let body = { code: "DOWNLOAD_FAILED", message: "Couldn't download your data." };
    try {
      const payload = await response.json() as { error?: typeof body };
      if (payload.error) body = payload.error;
    } catch { /* Keep a safe fallback when a proxy returns non-JSON text. */ }
    throw new ApiError(response.status, body);
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = "ai-tutor-my-data.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function requestAccountDeletion(password: string) {
  return api<{ eraseAfter: string }>("/me", { method: "DELETE", body: JSON.stringify({ password }) });
}
