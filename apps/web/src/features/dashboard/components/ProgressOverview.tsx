import { ArrowRight, RefreshCw } from "lucide-react";
import type { ProgressResponse } from "@ai-tutor/types";

type Props = { loading: boolean; error: string; summary?: ProgressResponse["summary"]; onOpen: () => void; onRetry: () => void };
export default function ProgressOverview({ loading, error, summary, onOpen, onRetry }: Props) {
  const percent = summary && summary.total > 0 ? Math.floor(summary.cleared / summary.total * 100) : 0;
  return <article className="rounded-3xl border border-blue-400/20 bg-[linear-gradient(145deg,rgba(27,43,91,.9),rgba(24,27,67,.96))] p-5 shadow-lg sm:p-6">
    <header className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Your Progress</h2><button onClick={onOpen} className="inline-flex items-center gap-1 rounded-xl border border-indigo-300/20 bg-indigo-400/10 px-3 py-2 text-xs">View Progress <ArrowRight size={14}/></button></header>
    {loading ? <p role="status" className="py-8 text-center text-sm text-indigo-200">Loading your progress…</p> : error || !summary ? <div className="py-6 text-sm text-indigo-200"><p>{error || "Progress is not available."}</p><button onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2"><RefreshCw size={14}/> Retry</button></div> : <><div className="mx-auto mt-4 grid size-40 place-items-center rounded-full p-3" style={{ background: `conic-gradient(#3987ff ${percent * 3.6}deg, rgba(91,111,180,.3) 0deg)` }} role="img" aria-label={`${percent}% of skills cleared`}><div className="grid size-full place-items-center rounded-full bg-[#111b40] text-center"><div><strong className="block text-3xl">{percent}%</strong><span className="text-sm">Skills cleared</span></div></div></div><div className="mt-4 grid grid-cols-3 gap-2"><Stat label="Total" value={summary.total}/><Stat label="Cleared" value={summary.cleared}/><Stat label="Review" value={summary.review_due}/></div></>}
  </article>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white/[.04] p-3"><p className="text-xs text-indigo-200">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>; }
