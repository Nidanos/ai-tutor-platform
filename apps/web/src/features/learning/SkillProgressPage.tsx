import { useEffect, useState, type SyntheticEvent } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ApiError, errorMessage } from "@/lib/api/client";
import { getMastery, getSkillMastery } from "@/lib/api/learning";
import type { CourseSlug, MasteryResponse } from "@ai-tutor/types";

type Props = { onBack: () => void; courseSlug: CourseSlug; courseTitle: string };

/** Skill history is per authenticated learner; this page never uses shared fake scores. */
export default function SkillProgressPage({ onBack, courseSlug, courseTitle }: Props) {
  const [skills, setSkills] = useState<MasteryResponse["skills"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setSkills((await getMastery(courseSlug)).skills); }
    catch (cause) { setError(cause instanceof ApiError ? cause.body.message : "Couldn't load skill mastery. Please try again."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [courseSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-w-0 space-y-5 pb-6 text-white">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-indigo-200 hover:text-white"><ArrowLeft size={17} /> Back to dashboard</button>
      <header><p className="text-sm text-indigo-300">Progress / {courseTitle}</p><h1 className="mt-1 text-3xl font-bold sm:text-4xl">Skill mastery</h1><p className="mt-2 text-indigo-200">Reading and writing are tracked separately for each skill, using the backend's effective scores.</p></header>
      {loading ? <p className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-6 text-indigo-200">Loading your mastery…</p> : error ? <section className="rounded-2xl border border-rose-400/25 bg-rose-500/5 p-5"><p>{error}</p><button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2"><RefreshCw size={16} /> Try again</button></section> : skills.length === 0 ? <p className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-6 text-indigo-200">No mastery evidence yet. Start learning to build your first evidence.</p> : <section className="space-y-3">{skills.map((item) => <article key={`${item.skill.id}:${item.languageCode}`} className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{item.skill.name}</h2><p className="mt-1 text-xs text-indigo-400">{item.attemptCount} attempts · {item.successCount} successful</p></div>{item.clearedAt && <span className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-200">Cleared</span>}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Score label="Reading" value={item.reading.effective} /><Score label="Writing" value={item.writing.effective} /></div>{(item.reading.lastEvidenceAt || item.writing.lastEvidenceAt) && <EvidenceHistory skillId={item.skill.id}/>}</article>)}</section>}
    </main>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  const percentage = Math.floor(Math.max(0, Math.min(1, value)) * 100);
  return <div><div className="mb-1 flex justify-between text-sm"><span className="text-indigo-200">{label}</span><strong>{percentage}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-indigo-950" role="progressbar" aria-label={`${label} effective mastery`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="h-full bg-gradient-to-r from-sky-400 to-violet-500" style={{ width: `${percentage}%` }} /></div></div>;
}

type History = NonNullable<MasteryResponse["skills"][number]["history"]>;

// GET /mastery has no history, so a skill's is read when its panel is first opened.
function EvidenceHistory({ skillId }: { skillId: string }) {
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState("");
  function load(event: SyntheticEvent<HTMLDetailsElement>) {
    if (!event.currentTarget.open || history) return;
    setError("");
    getSkillMastery(skillId).then((value) => setHistory(value.history ?? [])).catch((cause) => setError(errorMessage(cause, "Couldn't load this skill's history.")));
  }
  return <details onToggle={load} className="mt-4 rounded-xl border border-indigo-400/15 p-3"><summary className="cursor-pointer text-sm font-semibold">Evidence history</summary>
    {error ? <p className="mt-3 text-xs text-rose-200">{error}</p> : !history ? <p role="status" className="mt-3 text-xs text-indigo-300">Loading…</p> : <div className="mt-3 space-y-2">{history.slice().reverse().map((entry, index) => <div key={`${entry.createdAt}-${index}`} className="flex flex-wrap justify-between gap-2 border-t border-indigo-400/10 pt-2 text-xs text-indigo-200"><span>{entry.verdict ?? "Placement test"} · {entry.dimension} · {entry.rung === null ? "Placement test" : `Rung ${entry.rung}`}</span><span>{Math.floor(entry.scoreBefore * 100)}% → {Math.floor(entry.scoreAfter * 100)}%</span></div>)}</div>}
  </details>;
}
