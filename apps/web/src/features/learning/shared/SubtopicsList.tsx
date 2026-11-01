
import { ArrowRight, CheckCircle2 } from "lucide-react";

type Props = {
  topicName: string;
  subtopics: string[];
  completed: string[];
  onOpenSubtopic: (subtopic: string) => void;
};

export default function SubtopicsList({
  topicName,
  subtopics,
  completed,
  onOpenSubtopic,
}: Props) {
  const completedCount = subtopics.filter((sub) =>
    completed.includes(sub),
  ).length;

  return (
    <section className="rounded-2xl border border-blue-800/80 bg-gradient-to-br from-blue-950/90 to-indigo-950/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{topicName} Subtopics</h2>
          <p className="mt-2 text-sm text-blue-300">
            Select a subtopic to open its resources, summary, and practice.
          </p>
        </div>
        <span className="text-sm text-blue-300">
          {completedCount}/{subtopics.length} completed
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {subtopics.map((subtopic, index) => {
          const done = completed.includes(subtopic);

          return (
            <button
              key={subtopic}
              onClick={() => onOpenSubtopic(subtopic)}
              className="flex w-full items-center gap-4 rounded-xl border border-blue-800 bg-blue-950/50 p-4 text-left hover:border-purple-500"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-900 font-semibold">
                {index + 1}
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{subtopic}</span>
                <span className="mt-1 block text-sm text-blue-300">
                  Study the concept and solve related problems.
                </span>
              </span>
              {done && <CheckCircle2 className="text-emerald-400" />}
              <ArrowRight size={18} className="text-blue-300" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
