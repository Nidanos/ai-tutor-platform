import {
  Check,
  ChartNoAxesColumnIncreasing,
  Code2,
  Sparkles,
} from "lucide-react";

import type { DiagnosticCompleted } from "@ai-tutor/types";

type DiagnosticCompleteProps = {
  results: DiagnosticCompleted;
  onFinish: () => void;
};

function asPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function DiagnosticComplete({
  results,
  onFinish,
}: DiagnosticCompleteProps) {
  return (
    <section className="relative mx-auto flex w-full max-w-[1400px] items-center justify-center px-3 py-3 sm:px-4 sm:py-5 xl:px-40">
      <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-indigo-400/50 bg-gradient-to-br from-blue-950/80 via-indigo-950/80 to-purple-950/80 px-4 py-5 text-center shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:px-10 sm:py-8 lg:px-14 lg:py-7">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center sm:h-32 sm:w-32">
          <div className="absolute inset-0 rounded-full border border-indigo-300/50 bg-blue-400/10 shadow-[0_0_40px_rgba(99,102,241,0.3)]" />
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-300 bg-emerald-950/90 text-teal-200 shadow-[0_0_35px_rgba(45,212,191,0.35)] sm:h-24 sm:w-24">
            <Check size={38} strokeWidth={3} className="sm:hidden" />
            <Check size={58} strokeWidth={3} className="hidden sm:block" />
          </div>
          <Sparkles className="absolute right-0 top-2 text-violet-400 sm:top-4" size={18} />
          <Sparkles className="absolute left-0 top-10 text-violet-300 sm:top-16" size={14} />
          <span className="absolute bottom-0 left-1 h-2 w-2 rounded-full bg-violet-400" />
          <span className="absolute right-0 top-16 h-1.5 w-1.5 rounded-full bg-violet-400 sm:top-24" />
        </div>

        <h2 className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
          Assessment{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
            complete
          </span>{" "}
          <Check className="inline h-6 w-6 text-violet-300 sm:h-8 sm:w-8" />
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-indigo-100/90 sm:mt-4 sm:text-xl">
          Your diagnostic assessment is complete.
          <br />
          Here's your skill-wise assessment summary.
        </p>

        <div className="mx-auto mt-6 grid w-full max-w-2xl gap-4 text-left sm:mt-8">
          {results.results.length === 0 ? (
            <p className="rounded-2xl border border-indigo-400/30 bg-indigo-950/50 p-5 text-center text-indigo-100">
              No skill estimates were returned for this attempt.
            </p>
          ) : (
            results.results.map((result) => (
              <div
                key={result.skill.id}
                className="rounded-2xl border border-indigo-400/30 bg-indigo-950/50 p-4 sm:p-5"
              >
                <h3 className="text-lg font-semibold text-white">
                  {result.skill.name}
                </h3>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-indigo-300 sm:text-sm">Reading</p>
                    <p className="mt-1 text-xl font-bold text-blue-300">
                      {asPercent(result.estReading)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-300 sm:text-sm">Writing</p>
                    <p className="mt-1 text-xl font-bold text-violet-300">
                      {asPercent(result.estWriting)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-300 sm:text-sm">Confidence</p>
                    <p className="mt-1 text-xl font-bold text-teal-300">
                      {asPercent(result.confidence)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="mx-auto mt-5 flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl border border-blue-300/30 bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-300 sm:mt-8 sm:gap-4 sm:px-7 sm:py-5 sm:text-lg"
        >
          Go to Dashboard <span aria-hidden="true">→</span>
        </button>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-indigo-200 sm:mt-6 sm:text-base">
          <Sparkles size={16} className="shrink-0 text-violet-300 sm:h-[18px] sm:w-[18px]" />
          Your next step is ready when you are.
        </p>

        <div className="mx-auto mt-5 flex max-w-2xl items-center gap-2 text-xs text-indigo-200 sm:mt-8 sm:gap-4 sm:text-sm">
          <span className="h-px flex-1 bg-indigo-400/30" />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-300 text-teal-300 sm:h-8 sm:w-8">
            <Check size={17} />
          </span>
          <span className="whitespace-nowrap">Assessment completed</span>
          <span className="h-px flex-1 bg-indigo-400/30" />
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 xl:block">
        <p className="-rotate-6 text-lg italic leading-relaxed text-violet-300">
          A clear<br />starting point.
        </p>
        <div className="ml-5 mt-12 w-fit -rotate-6 rounded-2xl border border-violet-400/80 bg-violet-500/20 p-4 text-violet-300 shadow-lg shadow-violet-900/20">
          <ChartNoAxesColumnIncreasing size={58} strokeWidth={1.8} />
        </div>
        <p className="mt-10 rotate-3 text-base italic leading-relaxed text-violet-300">
          Understand today.<br />Grow tomorrow.
        </p>
        <svg viewBox="0 0 100 25" className="mt-3 h-6 w-28 text-violet-400" fill="none" aria-hidden="true">
          <path d="M2 18 Q12 0 22 18 T42 18 T62 18 T82 18 T98 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 xl:block">
        <p className="rotate-3 text-lg italic leading-relaxed text-violet-300">
          Small steps.<br />Big progress.
        </p>
        <svg viewBox="0 0 70 55" className="ml-6 mt-3 h-14 w-16 text-violet-400" fill="none" aria-hidden="true">
          <path d="M35 2 C35 24 27 35 8 47 M8 47 L10 34 M8 47 L21 45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="ml-2 mt-3 w-fit rotate-6 rounded-2xl border border-violet-400/80 bg-violet-500/20 p-4 text-violet-300 shadow-lg shadow-violet-900/20">
          <Code2 size={58} strokeWidth={1.8} />
        </div>
      </div>
    </section>
  );
}
