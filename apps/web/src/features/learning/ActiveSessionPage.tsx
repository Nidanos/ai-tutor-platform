import { ArrowLeft, ArrowRight, BookOpen, Pause, Play, Square } from "lucide-react";
import type { CourseSlug } from "@ai-tutor/types";
import { useStudySession } from "./session/useStudySession";
import { SessionFacts, SessionState } from "./session/SessionState";

type Props = { courseSlug: CourseSlug; displayName: string; onBack: () => void; onOpenExercise: (exerciseId: string) => void };

/** Shows and controls a real backend session; no browser-generated progress or fake session state. */
export default function ActiveSessionPage({ courseSlug, displayName, onBack, onOpenExercise }: Props) {
  const { session, loading, busy, error, load, start, setStatus } = useStudySession(courseSlug);
  const handleStart = async () => { const value = await start(); if (value?.step) onOpenExercise(value.step.exerciseId); };
  const handleResume = async () => { const value = await setStatus("active"); if (value?.step) onOpenExercise(value.step.exerciseId); };
  const handleContinue = () => { if (session?.step) onOpenExercise(session.step.exerciseId); };
  const isEnded = session?.status === "ended";
  const completed = isEnded && session?.endReason === "completed";

  return <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#111638] px-4 py-6 text-white sm:px-8">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_35%,rgba(37,99,235,.35),transparent_45%),radial-gradient(ellipse_at_85%_70%,rgba(147,51,234,.3),transparent_48%),linear-gradient(120deg,#172650,#202047_55%,#351d56)]" />
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-2xl border border-white/10 bg-white/[.06] p-4">
      <div><p className="text-lg font-semibold">AI Tutor</p><p className="text-xs text-indigo-200">Study session</p></div>
      <span className="text-sm text-indigo-100">{displayName}</span>
    </header>

    <section className="mx-auto flex w-full max-w-3xl flex-1 items-center py-8">
      <article className="w-full rounded-3xl border border-indigo-300/25 bg-gradient-to-br from-[#1e305b]/95 to-[#272352]/95 p-6 shadow-2xl sm:p-10">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-indigo-200 hover:text-white"><ArrowLeft size={16}/> Back to dashboard</button>
        <div className="mt-8 text-center"><span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 px-4 py-2 text-xs uppercase tracking-widest text-indigo-100"><BookOpen size={15}/> Your learning session</span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Pick up where you left off.</h1>
          <p className="mt-3 text-indigo-200">Your active session and next exercise are retrieved from your account.</p>
        </div>
        <SessionState loading={loading} error={error} onRetry={() => void load()}/>
        {session && <div className="mt-7 rounded-2xl border border-indigo-300/15 bg-white/[.05] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{session.step?.skill.name ?? (completed ? "Course complete" : isEnded ? "Session ended" : "Preparing your next exercise")}</h2><span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs capitalize text-indigo-100">{session.status}</span></div>
          {session.step && <p className="mt-2 text-sm text-indigo-200">{session.step.kind === "review" ? "Review exercise" : "Learning exercise"} · Level {session.step.rung} of 5 · Step {session.step.seq}</p>}
          {!session.step && <p className="mt-2 text-sm text-indigo-200">{completed ? "You have completed this course. Great work." : "The session does not currently contain an exercise step. Refresh to check whether the next step is ready."}</p>}
          <SessionFacts session={session}/>
        </div>}
        {!loading && !session && <p className="mt-7 rounded-xl border border-indigo-300/15 bg-white/[.04] p-4 text-center text-sm text-indigo-200">You don't have an open study session yet. Start one to begin.</p>}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {!session && <button type="button" disabled={busy || loading} onClick={() => void handleStart()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold disabled:opacity-50"><Play size={18}/> Start studying</button>}
          {session?.status === "paused" && <button type="button" disabled={busy} onClick={() => void handleResume()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold disabled:opacity-50"><Play size={18}/> Resume session</button>}
          {session?.status === "active" && !session.step && <button type="button" disabled={busy} onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/25 px-5 py-4 font-semibold disabled:opacity-50">Refresh next step</button>}
          {session?.status === "active" && <button type="button" disabled={busy || !session.step} onClick={handleContinue} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold disabled:opacity-50">Continue session <ArrowRight size={18}/></button>}
          {session?.status === "active" && <button type="button" disabled={busy} onClick={() => void setStatus("paused")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300/25 px-5 py-4 font-semibold disabled:opacity-50"><Pause size={18}/> Pause</button>}
          {session?.status === "active" && <button type="button" disabled={busy} onClick={() => void setStatus("ended")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/25 px-5 py-4 font-semibold text-rose-100 disabled:opacity-50"><Square size={17}/> End session</button>}
          {session?.status === "paused" && <button type="button" disabled={busy} onClick={() => void setStatus("ended")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/25 px-5 py-4 font-semibold text-rose-100 disabled:opacity-50"><Square size={17}/> End session</button>}
          {isEnded && !completed && <button type="button" onClick={() => void handleStart()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 font-semibold disabled:opacity-50"><Play size={18}/> Start a new session</button>}
        </div>
        {busy && <p role="status" className="mt-4 text-center text-xs text-indigo-200">Updating your session…</p>}
      </article>
    </section>
  </main>;
}
