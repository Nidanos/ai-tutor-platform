import { BookOpen } from "lucide-react";
import type { CourseSlug } from "@ai-tutor/types";
import { COURSE_OPTIONS } from "@/lib/courses";

type Props = { value: CourseSlug; onChange: (course: CourseSlug) => void };

export default function CourseSelector({ value, onChange }: Props) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
        <BookOpen size={20} />
      </span>
      <div><p className="text-sm font-semibold">Learning course</p>
        <p className="text-xs text-slate-400">Choose the subject you want to continue.</p></div>
    </div>
    <select value={value} onChange={(event) => onChange(event.target.value as CourseSlug)}
      aria-label="Select learning course"
      className="min-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
      {COURSE_OPTIONS.map((course) => <option key={course.slug} value={course.slug}>{course.title}</option>)}
    </select>
  </div>;
}
