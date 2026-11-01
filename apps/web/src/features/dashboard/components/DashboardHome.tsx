import { CheckCircle2, CircleHelp, Clock3 } from "lucide-react";
import HeroCard from "./HeroCard";
import MotivationCard from "./MotivationCard";
import QuoteCard from "./QuoteCard";
import CurrentLearningStatus from "./CurrentLearningStatus";
import ProgressOverview from "./ProgressOverview";
import RecentActivity from "./RecentActivity";
import { useDashboardData } from "../useDashboardData";
import type { CourseSlug } from "@ai-tutor/types";

// Static encouragement copy only; learner scores and activity always come from the API.
const dailyQuote = "Consistency today creates opportunity tomorrow.";

type Props = { courseSlug: CourseSlug; courseTitle: string; displayName: string; onStartLearning: () => void; onOpenPractice: (exerciseId?: string) => void; onOpenProgress: () => void; onOpenActiveSession: () => void };

/** Dashboard composition: API state lives in a hook and cards remain reusable. */
export default function DashboardHome({ courseSlug, courseTitle, displayName, onStartLearning, onOpenPractice, onOpenProgress, onOpenActiveSession }: Props) {
  const data = useDashboardData(courseSlug);
  const recommendation = data.recommendation?.recommendation;
  const waitingFor = data.recommendation?.waitingFor ?? [];
  const nextTitle = recommendation?.skill.name ?? (waitingFor.length ? "Finish your prerequisites" : courseTitle);
  const nextDescription = data.recommendationError || (data.loading ? "Checking your next recommended learning step…" : recommendation ? `Recommended level ${recommendation.rung} of 5${recommendation.reason === "review" ? " · Review due" : ""}.` : waitingFor.length ? `Complete prerequisites: ${waitingFor.map((item) => item.skill.name).join(", ")}.` : "Open your learning path to strengthen your understanding.");

  return <main className="min-w-0 space-y-6 pb-6"><header className="px-1"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, {displayName} 👋</h1><p className="mt-1 text-indigo-200/80">Continue your {courseTitle} journey. Build strong fundamentals and master your skills.</p></header>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.82fr)]"><HeroCard nextStep={{ title: nextTitle, description: nextDescription, skillId: recommendation?.exerciseId ?? "", actionLabel: data.loading ? "Loading…" : recommendation?.exerciseId ? "Start practice" : recommendation ? "Exercise preparing…" : "Open learning path" }} onStart={() => recommendation?.exerciseId ? onOpenPractice(recommendation.exerciseId) : onStartLearning()}/><ProgressOverview loading={data.loading} error={data.progressError} summary={data.progress?.summary} onOpen={onOpenProgress} onRetry={() => void data.reload()}/></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.82fr)]"><CurrentLearningStatus session={data.session} loading={data.loading} error={data.sessionError} onOpenSession={onOpenActiveSession} onStartSession={onOpenActiveSession} onRetry={() => void data.reload()}/><QuoteCard quote={dailyQuote}/></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.82fr)]"><RecentActivity courseSlug={courseSlug} onViewAll={onOpenProgress}/><MotivationCard/></section>
    {data.recommendation && !recommendation && waitingFor.length === 0 && !data.recommendationError && <p className="flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 size={17}/> The backend reports that this course is complete.</p>}
    {waitingFor.length > 0 && <p className="flex items-start gap-2 text-sm text-amber-200"><CircleHelp size={17}/> DSA depends on C++ Basics. Finish the listed prerequisites before continuing.</p>}
    <p className="flex items-center gap-2 text-xs text-indigo-400"><Clock3 size={14}/> Progress and study sessions are read from your account, not simulated in the browser.</p>
  </main>;
}
