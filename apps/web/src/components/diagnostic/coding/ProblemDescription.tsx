import { BookOpen, Code2, Terminal } from "lucide-react";

import type { DiagnosticQuestion } from "@/types/diagnostic";

type ProblemDescriptionProps = {
  question: DiagnosticQuestion;
};

export default function ProblemDescription({
  question,
}: ProblemDescriptionProps) {
  return (
    <section className="flex h-full flex-col overflow-y-auto bg-[#111a2e] text-white">
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

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {question.promptMd}
          </p>
        </div>

        {/* Function signature */}
        {question.functionSignature && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <Code2 size={16} />
              Function Signature
            </h3>

            <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0b1220] p-3 font-mono text-sm text-sky-300">
              {question.functionSignature}
            </pre>
          </div>
        )}

        {/* Sample information */}
        {question.sample && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
              <Terminal size={16} />
              Sample Test Case
            </h3>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs text-slate-400">
                  Input
                </p>

                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0b1220] p-3 font-mono text-sm text-slate-200">
                  {question.sample.input ?? "No input"}
                </pre>
              </div>

              <div>
                <p className="mb-2 text-xs text-slate-400">
                  Expected Output
                </p>

                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0b1220] p-3 font-mono text-sm text-emerald-300">
                  {question.sample.expectedOutput}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}