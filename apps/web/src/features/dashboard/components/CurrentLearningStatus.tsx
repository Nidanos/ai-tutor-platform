import { ArrowRight, BookOpen, PlayCircle } from "lucide-react";
import type { StudySession } from "@ai-tutor/types";

type Props = { session: StudySession | null; loading: boolean; error: string; onOpenSession: () => void; onStartSession: () => void; onRetry: () => void };

/** This card reflects the M9 session record, not a mastery status inferred as an open session. */
export default function CurrentLearningStatus({ session, loading, error, onOpenSession, onStartSession, onRetry }: Props) {
  return <article className="rounded-3xl border border-blue-400/20 bg-[linear-gradient(135deg,rgba(20,36,78,.94),rgba(21,25,61,.97))] p-5 shadow-lg sm:p-6">
    <div className="flex items-center gap-3"><BookOpen className="text-violet-300" size={25}/><div><h2 className="text-lg font-bold">Current learning status</h2><p className="text-sm text-indigo-200/70">Your saved study session</p></div></div>
    {loading ? <p role="status" className="mt-5 text-sm text-indigo-200">Checking your session…</p> : error ? <div className="mt-4 text-sm text-rose-200"><p>{error}</p><button onClick={onRetry} className="mt-2 underline">Retry</button></div> : session ? <button type="button" onClick={onOpenSession} className="mt-5 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300/20 bg-indigo-300/[.06] p-4 text-left transition hover:border-blue-300/50 hover:bg-indigo-300/[.12]"><span><span className="block font-semibold">{session.step?.skill.name ?? "Study session"}</span><span className="mt-1 block text-xs capitalize text-indigo-200">{session.status}{session.step ? ` · ${session.step.kind} · Level ${session.step.rung}` : " · Next exercise is being prepared"}</span></span><span className="inline-flex items-center gap-2 text-xs text-indigo-100">{session.status === "paused" ? "Resume" : "Open session"}<ArrowRight size={16}/></span></button> : <div className="mt-4 rounded-xl border border-white/5 bg-indigo-300/[.05] p-4"><p className="text-sm text-indigo-100">No active study session yet. Start studying to create one linked to your account.</p><button type="button" onClick={onStartSession} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold"><PlayCircle size={16}/> Start studying</button></div>}
  </article>;
}
