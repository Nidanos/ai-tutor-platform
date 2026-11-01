import { useEffect, useState } from "react";
import { getConsents, grantConsent, revokeConsent, type OptInKind } from "../api";
import type { Consent } from "@ai-tutor/types";
import { ApiError } from "@/lib/api/client";
const choices: Array<{ kind: OptInKind; label: string; description: string }> = [
  { kind: "ai_training", label: "AI training", description: "Allow eligible learning data to be used to improve AI Tutor models." },
  { kind: "research_study", label: "Research studies", description: "Allow eligible data to be used in research studies." },
];
export default function ConsentSettings({ enabled }: { enabled: boolean }) {
  const [consents, setConsents] = useState<Consent[]>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState<OptInKind | null>(null);
  useEffect(() => { if (!enabled) return; let active = true; getConsents().then((v) => { if (active) setConsents(v.consents); }).catch((e: unknown) => { if (active) setError(e instanceof ApiError ? e.body.message : "Couldn't load consent preferences."); }); return () => { active = false; }; }, [enabled]);
  async function toggle(kind: OptInKind, granted: boolean) { setBusy(kind); setError(""); try { if (granted) await grantConsent(kind); else await revokeConsent(kind); const result = await getConsents(); setConsents(result.consents); } catch (e) { setError(e instanceof ApiError ? e.body.message : "Couldn't update this preference."); } finally { setBusy(null); } }
  return <section className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-5 sm:p-6"><h2 className="text-xl font-bold">Privacy and consent</h2><p className="mt-1 text-sm text-indigo-300">Optional permissions are off unless you explicitly grant them.</p>{!enabled ? <p className="mt-3 text-sm text-amber-200">Sign in to manage privacy preferences.</p> : choices.map((item) => { const granted = consents.some((c) => c.kind === item.kind); return <div key={item.kind} className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-indigo-300/10 pt-4"><div className="max-w-2xl"><h3 className="font-semibold">{item.label}</h3><p className="mt-1 text-sm text-indigo-300">{item.description}</p><p className="mt-1 text-xs text-indigo-400">{granted ? "Granted" : "Not granted"}</p></div><button type="button" disabled={busy !== null} onClick={() => void toggle(item.kind, !granted)} className="rounded-lg border border-indigo-300/25 px-4 py-2 text-sm disabled:opacity-50">{busy === item.kind ? "Updating…" : granted ? "Revoke" : "Grant"}</button></div>; })}{error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}</section>;
}
