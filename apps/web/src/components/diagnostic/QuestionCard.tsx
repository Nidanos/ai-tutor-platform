import { Code2 } from "lucide-react";

import type { DiagnosticQuestion } from "@/types/diagnostic";
import CodingWorkspace from "./coding/CodingWorkspace";

type QuestionCardProps = {
  question: DiagnosticQuestion;
  selectedAnswer: string;
  savedCode: string | null;
  onCodeChange: (code: string) => void;
  onSelectAnswer: (answer: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  isBusy?: boolean;
};

export default function QuestionCard({
  question,
  selectedAnswer,
  savedCode,
  onCodeChange,
  onSelectAnswer,
  onContinue,
  onSkip,
  isBusy = false,
}: QuestionCardProps) {
  if (question.dimension === "writing") {
    return (
      <section className="w-full">
        <div className="mx-auto mt-5 flex w-full max-w-[1440px] items-center gap-4 rounded-xl border border-indigo-300/20 bg-white/[0.045] p-4 sm:p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/20 text-violet-200">
            <Code2 size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-white sm:text-lg">{question.skill.name}</h2>
            <p className="mt-1 text-sm text-indigo-200">Writing assessment · C++</p>
          </div>
        </div>

        <CodingWorkspace
          question={question}
          savedCode={savedCode}
          onCodeChange={onCodeChange}
          onSubmit={onContinue}
          isBusy={isBusy}
        />

        <div className="mx-auto mt-4 flex w-full max-w-[1440px] justify-end">
          <button
            type="button"
            onClick={onSkip}
            disabled={isBusy}
            className="rounded-xl border border-indigo-300/40 px-5 py-3 font-semibold text-indigo-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            I don't know / Skip task
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-7 w-full max-w-5xl rounded-2xl border border-indigo-300/20 bg-white/[0.045] p-5 shadow-xl shadow-indigo-950/20 backdrop-blur-md sm:p-7 lg:p-10">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-500/20 text-violet-200">
          <Code2 size={30} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{question.skill.name}</h2>
          <p className="text-sm text-indigo-200">Reading assessment</p>
        </div>
      </div>

      <h3 className="mt-7 whitespace-pre-wrap text-xl font-bold leading-snug text-white sm:text-2xl">
        {question.promptMd}
      </h3>

      {question.code && (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-indigo-300/20 bg-[#10182b]">
          <pre className="overflow-x-auto p-5 font-mono text-sm leading-7 text-sky-300 sm:text-base">
            {question.code}
          </pre>
        </div>
      )}

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium text-indigo-100">
          What will be the output?
        </span>
        <textarea
          value={selectedAnswer}
          onChange={(event) => onSelectAnswer(event.target.value)}
          placeholder="Enter the expected output..."
          rows={4}
          disabled={isBusy}
          className="w-full resize-y rounded-xl border border-indigo-300/30 bg-[#10182b] p-4 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400 disabled:opacity-60"
        />
      </label>

      <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onSkip}
          disabled={isBusy}
          className="rounded-xl border border-indigo-300/40 px-5 py-3.5 font-semibold text-indigo-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          I don't know / Skip
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedAnswer.trim() || isBusy}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isBusy ? "Saving..." : "Submit answer →"}
        </button>
      </div>
    </section>
  );
}
