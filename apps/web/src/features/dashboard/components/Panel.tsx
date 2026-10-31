import type { ReactNode } from "react";

type Props = { title: string; description?: string; children: ReactNode };

export default function Panel({ title, description, children }: Props) {
  return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
    <div className="mb-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
    </div>
    {children}
  </article>;
}
