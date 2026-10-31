import { BookOpen, Code2 } from "lucide-react";

import type { DiagnosticQuestion } from "@ai-tutor/types";
import Markdown from "@/components/ui/Markdown";

type ProblemDescriptionProps = {
  question: DiagnosticQuestion;
};

export default function ProblemDescription({
  question,
}: ProblemDescriptionProps) {
  return (
    <section className="flex h-full flex-col overflow-y-auto bg-panel text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
            <BookOpen size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              {question.skill.name}
            </h2>

            <p className="text-xs text-indigo-300">
              Writing Assessment
            </p>
          </div>
        </div>
      </div>

      {/* Problem description */}
      <div className="space-y-6 p-5">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-300">
            Problem Description
          </h3>

          <Markdown text={question.promptMd} className="text-sm leading-7 text-slate-200" />
        </div>

        {/* Function signature */}
        {question.functionSignature && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <Code2 size={16} />
              Function Signature
            </h3>

            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-code p-3 font-mono text-sm text-sky-300">
              {question.functionSignature}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}