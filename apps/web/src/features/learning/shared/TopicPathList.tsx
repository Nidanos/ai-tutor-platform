import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import type { CourseTopicGroup } from "@/lib/courses";
export default function TopicPathList({ topics, completed, onOpenTopic }: { topics: CourseTopicGroup[]; completed: string[]; onOpenTopic: (index: number) => void }) {
  return <section className="rounded-2xl border border-blue-800/80 bg-gradient-to-br from-blue-950/90 to-indigo-950/80 p-5 sm:p-6"><h2 className="text-xl font-bold">Your Learning Path</h2><p className="mt-2 text-sm text-blue-300">Choose a topic to explore its subtopics.</p><div className="mt-5 space-y-3">{topics.map((topic, index) => {
    const count = topic.subtopics.filter((item) => completed.includes(item)).length;
    return <button key={topic.name} type="button" onClick={() => onOpenTopic(index)} className="group flex w-full items-center gap-4 rounded-xl border border-blue-800 bg-blue-950/50 p-4 text-left hover:border-purple-500 hover:bg-purple-950/30"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-900 text-blue-200">{count === topic.subtopics.length ? <CheckCircle2/> : <BookOpen/>}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{topic.name}</span><span className="mt-1 block text-sm text-blue-300">{topic.description}</span><span className="mt-2 block text-xs text-blue-400">{count}/{topic.subtopics.length} completed</span></span><ArrowRight className="shrink-0 text-blue-300 group-hover:translate-x-1"/></button>;
  })}</div></section>;
}
