import { Binary, Check, Code2 } from "lucide-react";

import type { CourseSlug } from "@ai-tutor/types";
import { COURSES } from "@/lib/courses";

// The course list is shared with the learner screens (lib/courses.ts); this adds what the picker shows.
const DETAILS: Record<CourseSlug, { description: string; Icon: typeof Code2 }> = {
  "cpp-basics": { description: "New to programming, or to C++. Start from your first program.", Icon: Code2 },
  dsa: { description: "You can already write C++. Practise the structures and techniques problems need.", Icon: Binary },
};

type CoursePickerProps = {
  selected: CourseSlug | null;
  onSelect: (course: CourseSlug) => void;
  onBack: () => void;
  onContinue: () => void;
  isLoading?: boolean;
};

export default function CoursePicker({ selected, onSelect, onBack, onContinue, isLoading = false }: CoursePickerProps) {
  return (
    <section className="mx-auto mt-7 w-full max-w-4xl rounded-2xl border border-indigo-300/20 bg-white/[0.045] p-5 shadow-xl shadow-indigo-950/20 backdrop-blur-md sm:p-8">
      <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">
        Choose your{" "}
        <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">course</span>
      </h2>
      <p className="mt-3 text-center text-indigo-100/90">
        Your questions come from this course. Both use C++, and you can take the other course later.
      </p>

      <div role="radiogroup" aria-label="Course" className="mt-7 grid gap-4 sm:grid-cols-2">
        {COURSES.map(({ slug, title }) => {
          const { description, Icon } = DETAILS[slug];
          const isSelected = slug === selected;
          return (
            <button
              key={slug}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(slug)}
              disabled={isLoading}
              className={`relative rounded-2xl border p-6 text-center transition disabled:opacity-60 ${
                isSelected
                  ? "border-violet-400 bg-violet-500/15 shadow-lg shadow-violet-900/40"
                  : "border-white/10 bg-white/[0.03] hover:border-indigo-300/40"
              }`}
            >
              {isSelected && (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-white">
                  <Check size={16} />
                </span>
              )}
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                <Icon size={28} />
              </span>
              <span className="mt-4 block text-xl font-bold text-white">{title}</span>
              <span className="mt-2 block text-sm leading-relaxed text-indigo-100/80">{description}</span>
              <span className="mt-4 inline-block rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs text-indigo-200">.cpp</span>
            </button>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="rounded-xl border border-indigo-300/40 px-5 py-3 font-semibold text-indigo-100 transition hover:bg-white/10 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selected || isLoading}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Starting assessment..." : "Continue to assessment →"}
        </button>
      </div>
    </section>
  );
}
