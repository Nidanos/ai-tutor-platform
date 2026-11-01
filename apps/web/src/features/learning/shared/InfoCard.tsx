import type { ReactNode } from "react";

type Props = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

export default function InfoCard({
  title,
  icon,
  children,
}: Props) {
  return (
    <section className="rounded-2xl border border-blue-800/80 bg-gradient-to-br from-blue-950/90 to-indigo-950/80 p-5">
      <h2 className="mb-3 flex items-center gap-3 font-bold">
        <span className="text-purple-400">{icon}</span>
        {title}
      </h2>
      <div className="text-sm leading-6 text-blue-200">
        {children}
      </div>
    </section>
  );
}