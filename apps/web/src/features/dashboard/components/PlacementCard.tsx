import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

// The placement test shows past results if the learner has already taken it, so the link is always safe to offer.
export default function PlacementCard() {
  return <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Compass size={20} /></span>
      <div><p className="text-sm font-semibold">Placement test</p>
        <p className="text-xs text-slate-400">New here? Find your starting point, so you skip what you already know.</p></div>
    </div>
    <Link href="/diagnostic"
      className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
      Take the placement test <ArrowRight size={16} />
    </Link>
  </div>;
}
