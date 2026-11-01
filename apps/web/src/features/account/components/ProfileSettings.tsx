import { useMemo, useState } from "react";
import { Mail, Save, UserRound } from "lucide-react";
import type { AuthUser } from "@ai-tutor/types";
import { updateProfile } from "../api";
import { ApiError } from "@/lib/api/client";

type Props = { user: AuthUser | null; onUpdated: (user: AuthUser) => void };

export default function ProfileSettings({ user, onUpdated }: Props) {
  const [name, setName] = useState(user?.displayName ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Asia/Kolkata");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const zones = useMemo(() => getTimezones(timezone), [timezone]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !name.trim()) return;
    setBusy(true); setMessage("");
    try {
      const result = await updateProfile({ displayName: name.trim(), timezone });
      onUpdated(result.user); setMessage("Profile updated.");
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.body.message : "Couldn't update your profile.");
    } finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-5 sm:p-6">
    <h2 className="text-xl font-bold">Profile information</h2>
    {!user ? <p className="mt-3 text-sm text-amber-200">Sign in through the main AI Tutor app to view or edit account details.</p> :
      <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-indigo-200">Display name<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className="mt-2 w-full rounded-xl border border-indigo-300/20 bg-[#0b142d] p-3 text-white" /></label>
        <label className="text-sm text-indigo-200">Timezone<select value={timezone} onChange={(e) => setTimezone(e.target.value)} required className="mt-2 w-full rounded-xl border border-indigo-300/20 bg-[#0b142d] p-3 text-white">{zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
        <div className="flex items-center gap-2 text-sm text-indigo-300"><UserRound size={16} />{user.displayName}</div>
        <div className="flex items-center gap-2 text-sm text-indigo-300"><Mail size={16} />{user.email}</div>
        <div className="sm:col-span-2"><button disabled={busy || !name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold disabled:opacity-50"><Save size={16} />{busy ? "Saving…" : "Save profile"}</button>{message && <p role="status" className="mt-2 text-sm text-indigo-200">{message}</p>}</div>
      </form>}
  </section>;
}

function getTimezones(current: string): string[] {
  const supported = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Asia/Kolkata", "UTC"];
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [...new Set([current, browserZone, ...supported])].filter(Boolean).sort((a, b) => a.localeCompare(b));
}
