"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { AuthUser } from "@ai-tutor/types";
import Panel from "@/components/ui/Panel";
import { useAuth } from "@/features/auth/AuthProvider";
import { updateProfile } from "../api";
import { BUTTON, FIELD, messageOf } from "../shared";

// Correction right: the name and time zone are the fields a learner may change.
export default function ProfileSection({ user }: { user: AuthUser }) {
  const { setAuthenticatedUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [timezone, setTimezone] = useState(user.timezone);
  const [status, setStatus] = useState({ saving: false, message: "", isError: false });
  const zones = useMemo(() => {
    const all = Intl.supportedValuesOf("timeZone");
    return all.includes(user.timezone) ? all : [user.timezone, ...all];
  }, [user.timezone]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const changes = {
      ...(displayName.trim() !== user.displayName && { displayName: displayName.trim() }),
      ...(timezone !== user.timezone && { timezone }),
    };
    if (!Object.keys(changes).length) return setStatus({ saving: false, message: "Nothing to save.", isError: false });
    setStatus({ saving: true, message: "", isError: false });
    try {
      const { user: updated } = await updateProfile(changes);
      setAuthenticatedUser(updated);
      setStatus({ saving: false, message: "Saved.", isError: false });
    } catch (error) {
      setStatus({ saving: false, message: messageOf(error, "Couldn't save your profile."), isError: true });
    }
  }

  return (
    <Panel title="Profile" description="Your account details.">
      <div className="mb-5 flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-violet-500 text-2xl font-bold" aria-hidden="true">
          {user.displayName.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="font-semibold">{user.email}</p>
          <p className="text-sm capitalize text-slate-400">{user.role.toLowerCase()}</p>
        </div>
      </div>
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Name</span>
          <input className={FIELD} value={displayName} maxLength={80} required onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-300">Time zone</span>
          <select className={FIELD} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-4">
          <button type="submit" className={BUTTON} disabled={status.saving}>{status.saving ? "Saving…" : "Save changes"}</button>
          {status.message && (
            <p role="status" className={`text-sm ${status.isError ? "text-rose-300" : "text-emerald-300"}`}>{status.message}</p>
          )}
        </div>
      </form>
    </Panel>
  );
}
