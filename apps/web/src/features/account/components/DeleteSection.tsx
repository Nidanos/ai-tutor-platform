"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { useAuth } from "@/features/auth/AuthProvider";
import { requestDeletion } from "../api";
import { FIELD, messageOf } from "../shared";

// Erasure (privacy policy, section 9): confirmed with the password, then 7 days to change one's mind.
export default function DeleteSection({ timezone }: { timezone: string }) {
  const { reloadUser } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [eraseAfter, setEraseAfter] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await requestDeletion(password);
      setEraseAfter(new Date(result.eraseAfter).toLocaleString("en-IN", { timeZone: timezone, dateStyle: "long", timeStyle: "short" }));
    } catch (e) {
      setError(messageOf(e, "Couldn't delete your account."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Delete account" description="Close your account and erase your data.">
      {eraseAfter ? (
        <div role="status" className="space-y-4 text-sm">
          <p>
            Your account will be erased after <strong>{eraseAfter}</strong>. You've been signed out. Signing in before
            then cancels the deletion. We've also sent this to your email.
          </p>
          {/* The API has already cleared this browser's session; reloading the user takes the page to sign-in. */}
          <button type="button" onClick={() => void reloadUser()} className="rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">
            Go to sign-in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-sm">
          <p className="text-slate-400">
            We wait 7 days in case you change your mind: signing in during that time cancels the deletion. Then we erase
            your name, email, password, date of birth and code. Your progress is deleted too, unless you opted in to AI
            training or research: then only de-identified numbers stay.
          </p>
          <label className="block">
            <span className="mb-1 block text-slate-300">Your password, to confirm</span>
            <input className={FIELD} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit" disabled={busy || !password}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-500 disabled:opacity-50">
            <Trash2 size={16} /> {busy ? "Deleting…" : "Delete my account"}
          </button>
          {error && <p role="alert" className="text-rose-300">{error}</p>}
        </form>
      )}
    </Panel>
  );
}
