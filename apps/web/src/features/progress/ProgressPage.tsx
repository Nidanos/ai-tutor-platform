import { useEffect, useState } from "react";
import { Activity, ArrowRight, BookOpen, CheckCircle2, Clock3, LockKeyhole, RefreshCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { ScoreBar, StatusBadge, StateCard } from "./ProgressComponents";
import { getProgress } from "@/lib/api/learning";
import type { CourseSlug, ProgressResponse } from "@ai-tutor/types";

type Props = {
  courseSlug: CourseSlug;
  courseTitle: string;
  onContinueLearning: () => void;
  onViewSkillProgress: () => void;
};

/** Progress is displayed only from the API; the client never estimates mastery. */
export default function ProgressPage({ courseSlug, courseTitle, onContinueLearning, onViewSkillProgress }: Props) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProgress() {
    setLoading(true);
    setError("");
    try {
      setProgress(await getProgress(courseSlug));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.body.message : "Couldn't load your progress. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProgress(); }, 0);
    return () => window.clearTimeout(timer);
  }, [courseSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <StateCard title="Loading progress" detail={`Getting your latest ${courseTitle} progress from AI Tutor…`} />;
  if (error) return <StateCard title="Progress is unavailable" detail={error} action={<button onClick={() => void loadProgress()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2"><RefreshCw size={16} /> Try again</button>} />;
  if (!progress) return null;

  const summary = progress.summary;
  const percent = (count: number) => summary.total === 0 ? 0 : Math.floor((count / summary.total) * 100);
  const statuses = [
    { label: "Cleared", value: summary.cleared, icon: CheckCircle2 },
    { label: "Ready", value: summary.ready, icon: BookOpen },
    { label: "In progress", value: summary.in_progress, icon: Activity },
    { label: "Locked", value: summary.locked, icon: LockKeyhole },
    { label: "Review due", value: summary.review_due, icon: Clock3 },
  ];

  return (
    <main className="min-w-0 space-y-5 pb-6 text-white">
      <header>
        <p className="text-sm text-indigo-300">Progress / {courseTitle}</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Your learning progress</h1>
        <p className="mt-2 text-indigo-200">Skill status and effective reading/writing scores reported by the learning API.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statuses.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-4">
            <Icon size={21} className="text-violet-300" />
            <p className="mt-3 text-sm text-indigo-200">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-950"><div className="h-full bg-violet-500" style={{ width: `${percent(value)}%` }} /></div>
          </article>
        ))}
      </section>

      {progress.outside.length > 0 && <section className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4"><h2 className="font-semibold text-amber-200">Prerequisites from another course</h2><p className="mt-1 text-sm text-indigo-100">DSA builds on C++ Basics. Finish the listed prerequisites to unlock dependent skills.</p><div className="mt-3 flex flex-wrap gap-2">{progress.outside.map((item) => <span key={`${item.course.slug}/${item.skill.slug}`} className="rounded-lg border border-amber-300/20 px-3 py-2 text-sm">{item.skill.name} · {item.status.replace("_", " ")}</span>)}</div></section>}

      <section className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Skills in {courseTitle}</h2><p className="mt-1 text-sm text-indigo-300">Scores are effective values after forgetting, exactly as returned by the API.</p></div><button onClick={onViewSkillProgress} className="text-sm text-violet-300 hover:text-white">View skill details <ArrowRight size={15} className="ml-1 inline" /></button></div>
        <div className="space-y-3">
          {progress.skills.map((entry) => (
            <article key={entry.skill.id} className="rounded-xl border border-indigo-400/15 bg-indigo-950/25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{entry.skill.name}</h3>{entry.skill.description && <p className="mt-1 max-w-3xl text-sm leading-5 text-indigo-300">{entry.skill.description}</p>}</div><StatusBadge status={entry.status} /></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ScoreBar label="Reading" value={entry.reading.effective} />
                <ScoreBar label="Writing" value={entry.writing.effective} />
              </div>
              {entry.status === "locked" && <p className="mt-3 text-xs text-amber-200">Finish its prerequisites first.</p>}
              {entry.stage !== null && <p className="mt-2 text-xs text-indigo-400">Help stage: {entry.stage}</p>}
            </article>
          ))}
          {progress.skills.length === 0 && <p className="py-6 text-center text-sm text-indigo-300">No skills have been returned for this course yet.</p>}
        </div>
      </section>

      <button onClick={onContinueLearning} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-semibold">Continue learning <ArrowRight size={17} /></button>
    </main>
  );
}
