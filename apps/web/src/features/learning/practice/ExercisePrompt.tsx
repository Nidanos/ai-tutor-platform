import Markdown from "@/components/ui/Markdown";
import type { CourseSlug, Exercise } from "@ai-tutor/types";

export default function ExercisePrompt({ exercise, courseSlug }: { exercise: Exercise | null; courseSlug: CourseSlug }) {
  return <article className="min-w-0 rounded-2xl border border-blue-800/80 bg-gradient-to-br from-blue-950/90 to-indigo-950/80 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-blue-300">Practice · C++20</p><h2 className="mt-1 text-xl font-bold">{exercise?.title ?? "Your next exercise"}</h2></div><span className="rounded-full border border-blue-600/40 px-3 py-1 text-xs text-blue-200">{exercise ? `Level ${exercise.rung} of 5` : courseSlug}</span></div>
    {exercise ? <div className="mt-4"><Markdown text={exercise.promptMd} className="text-sm leading-7 text-indigo-100"/></div> : <p className="mt-4 text-sm leading-6 text-blue-100">The exercise is selected using your server-side learning progress.</p>}
    {exercise?.skill.description && <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-blue-200">{exercise.skill.description}</p>}
    {Boolean(exercise?.sampleTests.length) && <div className="mt-5"><h3 className="font-semibold">Sample examples</h3><div className="mt-2 space-y-2">{exercise?.sampleTests.map((test) => <div key={test.seq} className="rounded-lg bg-slate-950/80 p-3 text-sm"><p className="font-medium">{test.name}</p>{test.input !== null && <pre className="mt-1 whitespace-pre-wrap text-blue-200">Input: {test.input}</pre>}{test.expectedOutput !== null && <pre className="mt-1 whitespace-pre-wrap text-emerald-300">Expected: {test.expectedOutput}</pre>}</div>)}</div></div>}
    {exercise?.skill.resources.length ? <div className="mt-5"><h3 className="font-semibold">Further reading</h3>{exercise.skill.resources.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm text-violet-300 underline">{item.title}</a>)}</div> : null}
  </article>;
}
