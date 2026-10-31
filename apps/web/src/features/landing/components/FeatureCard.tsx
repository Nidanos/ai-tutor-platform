import type { ReactNode } from "react";

type FeatureCardProps = {
  label: string;
  title: string;
  description: string;
  tone: "green" | "pink" | "purple";
  children: ReactNode;
};

const cardTones = {
  green: "bg-[#D8E69B]",
  pink: "bg-[#DDAEBB]",
  purple: "bg-[#C6A9DF]",
};

function FeatureCard({
  label,
  title,
  description,
  tone,
  children,
}: FeatureCardProps) {
  return (
    <article
      className={`flex min-h-[340px] min-w-0 flex-col overflow-hidden rounded-2xl p-4 text-slate-900 ${cardTones[tone]}`}
    >
      {/* Card Label */}
      <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold">
        <span>•</span>
        {label}
        <span>→</span>
      </div>

      {/* Card Illustration */}
      <div className="my-4 flex min-h-40 flex-1 items-center">
        <div className="w-full">
          {children}
        </div>
      </div>

      {/* Card Content */}
      <div className="mt-auto">
        <h3 className="text-lg font-semibold leading-6">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-5 text-slate-700">
          {description}
        </p>
      </div>
    </article>
  );
}

export default FeatureCard;