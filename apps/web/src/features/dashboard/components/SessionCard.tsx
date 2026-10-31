import { Clock3, Play, PauseCircle, ArrowRight } from "lucide-react";
import type { useDashboardData } from "../useDashboardData";
import Panel from "./Panel";
import LoadState from "./LoadState";

type Props = { data: ReturnType<typeof useDashboardData>; onStart: () => void; onOpen: (id: string) => void };
const duration = (milliseconds: number) => `${Math.floor(milliseconds / 60000)} min`;

export default function SessionCard({ data, onStart, onOpen }: Props) {
  const session = data.session;
  return <Panel title="Current learning session" description="Your saved study session from the platform.">
    {data.loading || data.errors.session ? <LoadState loading={data.loading}
      error={data.errors.session} onRetry={() => void data.reload()} empty="" /> : session ? <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-800/70 p-4">
      <div className="flex items-center gap-3">
        <PauseCircle className="text-cyan-300" size={24} />
        <div><p className="font-semibold">{session.step?.skill.name ?? "Study session"}</p>
          <p className="mt-1 text-xs capitalize text-slate-400">{session.status} · {duration(session.activeMs)} studied</p></div>
      </div>
      {session.step ? <button type="button" onClick={() => onOpen(session.step!.exerciseId)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">{session.status === "paused" ? "Resume" : "Open session"}<ArrowRight size={16} /></button>
        : <p className="text-sm text-slate-400">Your next exercise is being prepared.</p>}
    </div> : <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-slate-400">No active study session. Start one when you are ready.</p>
      <button type="button" onClick={onStart} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"><Play size={16} /> Start studying</button>
    </div>}
    <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Clock3 size={14} /> Idle time is excluded from active study time.</p>
  </Panel>;
}
