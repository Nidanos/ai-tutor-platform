import { Clock3, RefreshCw } from "lucide-react";
import type { StudySession } from "@ai-tutor/types";

export function SessionState({ loading, error, onRetry }: { loading: boolean; error: string; onRetry: () => void }) {
  if (loading) return <p role="status" className="text-sm text-indigo-200">Checking your study session…</p>;
  if (!error) return null;
  return <div role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">
    <p>{error}</p><button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-2 underline"><RefreshCw size={14}/> Retry</button>
  </div>;
}

export function SessionFacts({ session }: { session: StudySession }) {
  const minutes = Math.floor(session.activeMs / 60000);
  const seconds = Math.floor((session.activeMs % 60000) / 1000);
  return <div className="mt-4 flex flex-wrap gap-3 text-xs text-indigo-200">
    <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"><Clock3 size={14}/> Study time: {minutes}m {seconds}s</span>
    <span className="rounded-lg bg-white/5 px-3 py-2 capitalize">Status: {session.status}</span>
  </div>;
}
