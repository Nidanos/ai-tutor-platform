import { ArrowRight, BookOpenCheck } from "lucide-react";
import type { useDashboardData } from "../useDashboardData";
import Panel from "./Panel";
import LoadState from "./LoadState";

type Data = ReturnType<typeof useDashboardData>;
type Props = { data: Data; courseTitle: string; onOpen: (id: string) => void };

export default function NextStepCard({ data, courseTitle, onOpen }: Props) {
  const item = data.recommendation?.recommendation;
  const waiting = data.recommendation?.waitingFor ?? [];
  const empty = waiting.length ? `Complete prerequisites: ${waiting.map((x) => x.skill.name).join(", ")}.` : "The course is complete. Explore your progress.";
  return <Panel title="Your next step" description={`A recommended action for ${courseTitle}`}>
    {data.loading || data.errors.recommendation ? <LoadState loading={data.loading}
      error={data.errors.recommendation} onRetry={() => void data.reload()} empty="" /> : item ? <>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><BookOpenCheck /></span>
        <div><p className="font-semibold">{item.skill.name}</p>
          <p className="mt-1 text-sm text-slate-400">Level {item.rung} of 5 · {item.reason === "review" ? "Review" : "New skill"}</p></div>
      </div>
      {item.exerciseId ? <button type="button" onClick={() => onOpen(item.exerciseId!)}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Continue learning <ArrowRight size={16} /></button>
        : <p className="mt-5 text-sm text-amber-300">New exercises for this skill are being prepared.</p>}
    </> : <p className="py-4 text-sm text-slate-400">{empty}</p>}
  </Panel>;
}
