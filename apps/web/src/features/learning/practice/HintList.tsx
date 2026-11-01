import Markdown from "@/components/ui/Markdown";
import type { Hint } from "@ai-tutor/types";
export default function HintList({ hints }: { hints: Hint[] }) { return <>{hints.map((hint) => <div key={hint.level} className="mx-4 mb-3 rounded-xl border border-violet-400/20 bg-violet-400/10 p-3"><p className="text-xs font-semibold text-violet-300">{hint.level === 5 ? "Answer revealed · does not count towards progress" : `Hint ${hint.level}`} · {hint.source}</p><Markdown text={hint.bodyMd} className="text-sm leading-7 text-indigo-100"/></div>)}</>; }
