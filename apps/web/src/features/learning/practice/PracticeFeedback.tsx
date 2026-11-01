import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import type { SubmissionResult } from "@ai-tutor/types";
import { VERDICT_TEXT } from "@/lib/verdicts";
import type { PracticeView } from "./practice.types";

export default function PracticeFeedback({ view, error, result, retryRequest, pendingId, onRetry, onCheck, onReload, onTryAgain }: { view: PracticeView; error: string; result: SubmissionResult | null; retryRequest: boolean; pendingId: boolean; onRetry: () => void; onCheck: () => void; onReload: () => void; onTryAgain: () => void }) {
  return <>
    {view === "loading" && <p role="status" className="p-4 text-sm text-blue-200">Loading the next recommended exercise…</p>}
    {error && <div role="alert" className="mx-4 mb-4 flex flex-wrap items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100"><AlertCircle size={18}/><span className="min-w-0 flex-1">{error}</span>{view === "pending" && retryRequest && <button onClick={onRetry} className="underline">Retry same submission</button>}{view === "pending" && pendingId && !retryRequest && <button onClick={onCheck} className="underline">Check result</button>}{(view === "error" || (view === "ready" && !result)) && <button onClick={onReload} className="underline">Reload</button>}</div>}
    {result && <ResultCard result={result} onReload={onReload} onTryAgain={onTryAgain}/>}
  </>;
}

function ResultCard({ result, onReload, onTryAgain }: { result: SubmissionResult; onReload: () => void; onTryAgain: () => void }) {
  const accepted = result.verdict === "AC";
  return <div className={`mx-4 mb-4 rounded-xl border p-4 ${accepted ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}><div className="flex items-center gap-2 font-semibold">{accepted ? <CheckCircle2 className="text-emerald-300"/> : <AlertCircle className="text-rose-300"/>}{VERDICT_TEXT[result.verdict]}</div><p className="mt-2 text-sm">Tests passed: {result.testsPassed} / {result.testsTotal}</p>{result.compileOutput && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs">{result.compileOutput}</pre>}
    {result.tests.filter((test) => test.verdict !== "AC").map((test) => <details key={test.seq} className="mt-3 rounded-lg border border-white/10 bg-black/15 p-3"><summary className="cursor-pointer text-sm">Test {test.seq}: {test.name} · {test.verdict}</summary>{test.visibility === "sample" ? <div className="mt-3 space-y-2 text-xs">{test.input !== undefined && <pre>Input: {test.input}</pre>}{test.expectedOutput !== undefined && <pre>Expected: {test.expectedOutput}</pre>}{test.output !== undefined && <pre>Your output: {test.output}</pre>}</div> : <p className="mt-2 text-xs text-indigo-300">Hidden test details are not available.</p>}</details>)}
    <button onClick={accepted ? onReload : onTryAgain} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm"><RefreshCw size={15}/>{accepted ? "Load next recommendation" : "Try again"}</button></div>;
}
