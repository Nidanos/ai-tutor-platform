import { Lightbulb, Play } from "lucide-react";
import type { Attempt } from "@ai-tutor/types";
import type { PracticeView } from "./practice.types";

type Props = { attempt: Attempt | null; view: PracticeView; hintLoading: boolean; canSubmit: boolean; onHint: () => void; onSubmit: () => void };
export default function PracticeActions({ attempt, view, hintLoading, canSubmit, onHint, onSubmit }: Props) {
  const hintBlocked = !attempt || attempt.status !== "active" || hintLoading || view === "submitting" || view === "pending" || attempt.hintLevel >= attempt.hintCeiling;
  return <div className="grid gap-3 border-t border-blue-900 p-4 sm:grid-cols-2"><button type="button" onClick={onHint} disabled={hintBlocked} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/50 px-4 py-3 font-semibold text-violet-200 disabled:opacity-50"><Lightbulb size={17}/>{hintLoading ? "Getting hint…" : "Get a hint"}</button><button type="button" onClick={onSubmit} disabled={!canSubmit} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Play size={17}/>{view === "submitting" ? "Running tests…" : "Submit answer"}</button></div>;
}
