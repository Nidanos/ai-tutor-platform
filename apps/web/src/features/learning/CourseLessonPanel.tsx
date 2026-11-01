import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getLesson, getLessonNote } from "@/lib/api/learning";
import type { LessonResponse } from "@ai-tutor/types";
import Markdown from "@/components/ui/Markdown";
import MermaidDiagram from "@/components/ui/MermaidDiagram";

type Props = { skillId: string; skillName: string; onPractice: () => void };

/** Lesson content and personal notes come from the authenticated API for the selected skill. */
export default function CourseLessonPanel({ skillId, skillName, onPractice }: Props) {
  const [data, setData] = useState<LessonResponse | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prediction, setPrediction] = useState("");
  const [showCheck, setShowCheck] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setData(null);
    setNote(null);
    setShowCheck(false);
    setPrediction("");

    try {
      const response = await getLesson(skillId);
      setData(response);
      // A live note is optional and rate-limited; a missing note must not break the lesson.
      try { setNote((await getLessonNote(skillId)).note?.bodyMd ?? null); } catch { setNote(null); }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.body.message : "Couldn't load this lesson. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    // Defer the initial async request until the effect returns; it still reruns per skill ID.
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) return <section role="status" className="rounded-2xl border border-blue-800 bg-blue-950/60 p-6 text-blue-200">Loading {skillName} lesson…</section>;
  if (error) return <section className="rounded-2xl border border-rose-400/25 bg-rose-500/5 p-5"><div className="flex items-start gap-3"><AlertCircle className="mt-1 shrink-0 text-rose-300"/><div><h3 className="font-semibold">Lesson unavailable</h3><p className="mt-1 text-sm text-indigo-100">{error}</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm"><RefreshCw size={15}/> Retry</button></div></div></section>;
  if (!data?.lesson) return (
    <section className="rounded-2xl border border-blue-800 bg-blue-950/60 p-6">
      <h3 className="text-xl font-bold">Lesson coming soon</h3>
      <p className="mt-2 text-sm text-indigo-200">There's no published lesson for {skillName} yet. You can continue with the next recommended exercise.</p>
      <button type="button" onClick={onPractice} className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold">Go to practice</button>
    </section>
  );

  const lesson = data.lesson;
  const normalizedPrediction = prediction.replace(/[\t ]+$/gm, "").trimEnd();
  const normalizedOutput = lesson.check.output.replace(/[\t ]+$/gm, "").trimEnd();
  const matched = normalizedPrediction === normalizedOutput;

  return <section className="space-y-4 rounded-2xl border border-blue-800/80 bg-gradient-to-br from-blue-950/90 to-indigo-950/80 p-5 sm:p-6">
    {note && <aside className="rounded-xl border border-violet-400/25 bg-violet-400/10 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-300">For you</p><Markdown text={note} className="text-sm leading-7 text-indigo-100"/></aside>}
    <header><p className="text-xs uppercase tracking-widest text-blue-300">{data.level} lesson</p><h2 className="mt-1 text-2xl font-bold">{skillName}</h2></header>
    <section><h3 className="mb-3 text-lg font-semibold">Understand the concept</h3><Markdown text={lesson.explanationMd} className="text-sm leading-7 text-indigo-100"/></section>
    <section className="border-t border-indigo-400/15 pt-4"><h3 className="mb-3 text-lg font-semibold">Visual overview</h3><MermaidDiagram source={lesson.diagram}/></section>
    <section className="border-t border-indigo-400/15 pt-4"><h3 className="mb-3 text-lg font-semibold">Worked example</h3><pre className="overflow-x-auto rounded-xl bg-[#0b1226] p-4 font-mono text-sm leading-6 text-emerald-100"><code>{lesson.example.code}</code></pre><h4 className="mt-3 font-semibold">Output</h4><pre className="mt-2 overflow-x-auto rounded-xl border border-emerald-400/15 bg-emerald-950/30 p-3 font-mono text-sm text-emerald-200">{lesson.example.output}</pre><h4 className="mb-2 mt-4 font-semibold">Walkthrough</h4><Markdown text={lesson.example.walkthroughMd} className="text-sm leading-7 text-indigo-100"/></section>
    <section className="border-t border-indigo-400/15 pt-4"><h3 className="mb-3 text-lg font-semibold">Common mistakes</h3><Markdown text={lesson.mistakesMd} className="text-sm leading-7 text-indigo-100"/></section>
    <section className="border-t border-indigo-400/15 pt-4"><h3 className="text-lg font-semibold">Quick check</h3><p className="mt-1 text-sm text-indigo-200">What does this program print? Try to predict its output before revealing the answer.</p><pre className="mt-3 overflow-x-auto rounded-xl bg-[#0b1226] p-4 font-mono text-sm leading-6 text-emerald-100"><code>{lesson.check.code}</code></pre><label className="mt-4 block text-sm font-medium" htmlFor="lesson-prediction">Your predicted output</label><textarea id="lesson-prediction" value={prediction} onChange={(event) => { setPrediction(event.target.value); setShowCheck(false); }} className="mt-2 min-h-24 w-full rounded-xl border border-indigo-400/20 bg-[#0c1428] p-3 font-mono text-sm text-white outline-none focus:border-violet-400" placeholder="Type the output…"/><button type="button" onClick={() => setShowCheck(true)} disabled={!prediction.trim()} className="mt-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold disabled:opacity-50">Check my answer</button>{showCheck && <div className="mt-4 rounded-xl border border-indigo-400/20 bg-black/15 p-4"><p className={`flex items-center gap-2 font-semibold ${matched ? "text-emerald-200" : "text-amber-200"}`}><CheckCircle2 size={18}/>{matched ? "Your prediction matches the expected output." : "Compare your prediction with the expected output."}</p><p className="mt-3 text-sm text-indigo-200">Expected output</p><pre className="mt-1 whitespace-pre-wrap rounded-lg bg-[#0b1226] p-3 font-mono text-sm text-emerald-200">{lesson.check.output}</pre><div className="mt-3"><Markdown text={lesson.check.explanationMd} className="text-sm leading-7 text-indigo-100"/></div><p className="mt-2 text-xs text-indigo-400">This quick check does not affect mastery or progress.</p></div>}</section>
  </section>;
}
