// Shared by the account page's sections, styled like the dashboard.
export const FIELD = "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100";
export const BUTTON =
  "inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50";

export const messageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);
