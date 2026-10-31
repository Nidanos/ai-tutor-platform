import { RefreshCw } from "lucide-react";

type Props = { loading: boolean; error: string; onRetry: () => void; empty: string };

export default function LoadState({ loading, error, onRetry, empty }: Props) {
  if (loading) return <p role="status" className="py-6 text-sm text-slate-400">Loading…</p>;
  if (error) return <div className="py-4 text-sm text-rose-300">
    <p>{error}</p><button type="button" onClick={onRetry}
      className="mt-3 inline-flex items-center gap-2 underline"><RefreshCw size={14} /> Try again</button>
  </div>;
  return <p className="py-4 text-sm text-slate-400">{empty}</p>;
}
