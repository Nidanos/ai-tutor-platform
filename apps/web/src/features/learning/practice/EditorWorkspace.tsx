import CodeEditor from "@/components/editor/CodeEditor";
import type { Exercise } from "@ai-tutor/types";

export default function EditorWorkspace({ exercise, answer, setAnswer, disabled }: { exercise: Exercise | null; answer: string; setAnswer: (value: string) => void; disabled: boolean }) {
  const prediction = exercise?.rung === 1;
  return <article className="min-w-0 overflow-hidden rounded-2xl border border-blue-800/80 bg-[#0c1428]">
    <div className="flex items-center justify-between gap-3 border-b border-blue-900 p-4"><h3 className="font-semibold">{prediction ? "Your predicted output" : "C++20 Editor"}</h3><span className="text-xs text-blue-300">clang 19 · C++20</span></div>
    {prediction ? <><pre aria-label="Program to read" className="overflow-x-auto border-b border-blue-900 bg-[#0b1226] p-4 font-mono text-sm leading-6 text-emerald-100"><code>{exercise.starterCode}</code></pre><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={disabled} placeholder="Type the output you expect…" className="min-h-48 w-full resize-y bg-[#0c1428] p-4 font-mono text-sm text-white outline-none focus:ring-1 focus:ring-violet-500" aria-label="Predicted output"/></> : <CodeEditor height="360px" value={answer} onChange={setAnswer} readOnly={disabled}/>}
  </article>;
}
