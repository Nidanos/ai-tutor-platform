"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { downloadData, listConsents, setConsent } from "../api";
import { BUTTON, messageOf } from "../shared";

// The two optional uses from the privacy policy (section 3), worded as there. Both are off by default.
const OPT_INS = [
  { kind: "ai_training", title: "AI model training", text: "Use my de-identified learning data to train or improve Nidanos's own AI models." },
  { kind: "research_study", title: "Research", text: "Use my de-identified data in Nidanos's academic study and in published research papers." },
] as const;
type OptIn = (typeof OPT_INS)[number]["kind"];

export default function PrivacySection() {
  const [on, setOn] = useState<Record<OptIn, boolean> | null>(null);
  const [busy, setBusy] = useState<OptIn | "download" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listConsents()
      .then(({ consents }) => {
        const live = new Set(consents.map((c) => c.kind));
        setOn({ ai_training: live.has("ai_training"), research_study: live.has("research_study") });
      })
      .catch((e) => setError(messageOf(e, "Couldn't load your privacy choices.")));
  }, []);

  async function toggle(kind: OptIn, next: boolean) {
    setBusy(kind);
    setError("");
    try {
      await setConsent(kind, next);
      setOn((old) => old && { ...old, [kind]: next });
    } catch (e) {
      setError(messageOf(e, "Couldn't change that choice."));
    } finally {
      setBusy(null);
    }
  }

  async function download() {
    setBusy("download");
    setError("");
    try {
      await downloadData();
    } catch (e) {
      setError(messageOf(e, "Couldn't start the download."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel title="Privacy" description="Optional uses of your data. You can change these at any time.">
      <div className="space-y-3">
        {OPT_INS.map(({ kind, title, text }) => (
          <label key={kind} className="flex items-start gap-3 rounded-xl bg-slate-800/70 p-4">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-cyan-400"
              checked={on?.[kind] ?? false}
              disabled={!on || busy !== null}
              onChange={(e) => void toggle(kind, e.target.checked)}
            />
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-slate-400">{text}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Withdrawing doesn't affect what was done before you withdrew.</p>

      <div className="mt-6 border-t border-slate-800 pt-5">
        <h3 className="font-semibold">Download my data</h3>
        <p className="mt-1 text-sm text-slate-400">
          One file with everything AI-Tutor holds about you, what it's used for, and who it was shared with.
        </p>
        <button type="button" className={`${BUTTON} mt-4`} disabled={busy !== null} onClick={() => void download()}>
          <Download size={16} /> {busy === "download" ? "Preparing…" : "Download my data"}
        </button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    </Panel>
  );
}
