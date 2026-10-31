import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { useDashboardData } from "./useDashboardData";
import Panel from "./Panel";
import LoadState from "./LoadState";

type Props = { data: ReturnType<typeof useDashboardData>; onOpen: () => void };

export default function ProgressCard({ data, onOpen }: Props) {
  const summary = data.progress?.summary;
  const percent = summary?.total ? Math.floor((summary.cleared / summary.total) * 100) : 0;
  return <Panel title="Your progress" description="Progress calculated by your learning platform.">
    {!summary || data.errors.progress ? <LoadState loading={data.loading}
      error={data.errors.progress} onRetry={() => void data.reload()} empty="No progress data yet." /> : <>
      <div className="flex items-center gap-5">
        <div className="grid size-24 shrink-0 place-items-center rounded-full border-8 border-cyan-400/70">
          <strong className="text-xl">{percent}%</strong>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3">
          <Stat label="Skills" value={summary.total} />
          <Stat label="Cleared" value={summary.cleared} />
          <Stat label="Ready" value={summary.ready} />
          <Stat label="Review due" value={summary.review_due} />
        </div>
      </div>
      <button type="button" onClick={onOpen} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
        View detailed progress <ArrowUpRight size={16} />
      </button>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14} /> Based on saved server progress.</p>
    </>}
  </Panel>;
}
function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-slate-800/70 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
