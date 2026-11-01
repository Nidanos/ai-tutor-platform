import type { ReactNode } from "react";
import type { ProgressResponse } from "@ai-tutor/types";

export function ScoreBar({ label, value }: { label: string; value: number }) {
  // API values are fractions from 0 to 1. Do not round upward or merge the dimensions.
  const clamped = Math.max(0, Math.min(1, value));
  const percentage = Math.floor(clamped * 100);
  return <div><div className="mb-1 flex justify-between text-xs"><span className="text-indigo-200">{label}</span><span>{percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#22315e]" role="progressbar" aria-label={`${label} effective mastery`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500" style={{ width: `${percentage}%` }} /></div></div>;
}

export function StatusBadge({ status }: { status: ProgressResponse["skills"][number]["status"] }) {
  const label = status === "review_due" ? "Review due" : status.replace("_", " ");
  const color = status === "cleared" ? "border-emerald-400/30 text-emerald-200" : status === "locked" ? "border-amber-400/30 text-amber-200" : status === "review_due" ? "border-violet-400/30 text-violet-200" : "border-blue-400/30 text-blue-200";
  return <span className={`rounded-full border px-3 py-1 text-xs capitalize ${color}`}>{label}</span>;
}

export function StateCard({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <section className="rounded-2xl border border-blue-400/20 bg-[#101d42]/90 p-6"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-200">{detail}</p>{action}</section>;
}
