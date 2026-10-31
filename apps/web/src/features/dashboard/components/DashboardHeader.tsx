import { LogOut, Sparkles } from "lucide-react";

type Props = { displayName: string; onLogout: () => Promise<void> };

export default function DashboardHeader({ displayName, onLogout }: Props) {
  return <header className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
        <Sparkles size={16} /> AI TUTOR
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        Welcome back, {displayName}
      </h1>
      <p className="mt-1 text-sm text-slate-400">Your learning journey, all in one place.</p>
    </div>
    <button type="button" onClick={() => void onLogout()}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
      <LogOut size={16} /> Log out
    </button>
  </header>;
}
