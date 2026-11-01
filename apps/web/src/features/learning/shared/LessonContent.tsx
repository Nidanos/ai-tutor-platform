import { AlertCircle, RefreshCw } from "lucide-react";
import CourseLessonPanel from "../CourseLessonPanel";
import type { ProgressResponse } from "@ai-tutor/types";

type Props = { skill?: ProgressResponse["skills"][number]; skillName: string; error: string; loading: boolean; onRetry: () => void; onPractice: () => void };
export default function LessonContent({ skill, skillName, error, loading, onRetry, onPractice }: Props) {
  if (skill) return <CourseLessonPanel key={skill.skill.id} skillId={skill.skill.id} skillName={skill.skill.name} onPractice={onPractice}/>;
  return <section className="rounded-2xl border border-blue-800 bg-blue-950/60 p-6"><h2 className="text-lg font-bold">{error ? "Course skills unavailable" : loading ? "Loading skill information…" : "Skill not available"}</h2><p className="mt-2 text-sm text-blue-200">{error || `Looking up ${skillName} using the selected course's API skill list.`}</p>{error && <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold"><RefreshCw size={15}/> Retry</button>}{error && <AlertCircle aria-hidden="true" className="mt-3 text-amber-300" size={18}/>}</section>;
}
