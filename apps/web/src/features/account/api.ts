import type { AuthUser, Consent, ConsentKind } from "@ai-tutor/types";
import { api } from "@/lib/api/client";

// The learner's data rights (privacy policy, section 8): correct, download, withdraw consent, delete.
export const updateProfile = (profile: { displayName?: string; timezone?: string }) =>
  api<{ user: AuthUser }>("/me", { method: "PATCH", body: JSON.stringify(profile) });

export const listConsents = () => api<{ consents: Consent[] }>("/me/consents");

export const setConsent = (kind: Extract<ConsentKind, "research_study" | "ai_training">, on: boolean) =>
  api(`/me/consents/${kind}`, { method: on ? "PUT" : "DELETE" });

export const requestDeletion = (password: string) =>
  api<{ eraseAfter: string }>("/me", { method: "DELETE", body: JSON.stringify({ password }) });

// The download is a file, not an API reply. Checking the session first refreshes an expired one;
// then the browser saves the file and stays on this page.
export async function downloadData() {
  await api("/auth/me");
  window.location.assign("/api/v1/me/data");
}
