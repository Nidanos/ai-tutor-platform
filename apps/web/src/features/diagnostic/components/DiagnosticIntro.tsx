import Image from "next/image";

type DiagnosticIntroProps = {
  onStart: () => void;
};

export default function DiagnosticIntro({
  onStart,
}: DiagnosticIntroProps) {
  return (
    <section className="mx-auto grid w-full max-w-[1320px] items-center gap-5 py-5 lg:grid-cols-[0.9fr_1.35fr_0.9fr] lg:gap-6 lg:py-2 xl:gap-10">
      <div className="hidden space-y-3 lg:block">
        <Feature
          title="Find your level"
          description="Understand what you already know."
          icon="◎"
        />
        <Feature
          title="Personalized path"
          description="Get a learning experience tailored to you."
          icon="▥"
        />
        <Feature
          title="Learn more effectively"
          description="Focus on what matters most for your growth."
          icon="ϟ"
        />
      </div>

      <div className="text-center">
        <h2 className="text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-4xl xl:text-6xl">
          Let's find your{" "}
          <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            starting point.
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-indigo-100/90 sm:text-lg xl:text-xl">
          We will ask a few questions to understand what you already know.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="mt-6 rounded-2xl border border-white/20 bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60 sm:px-10 sm:py-5 sm:text-lg"
        >
          ✦ Start Assessment →
        </button>

        <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-indigo-200 sm:text-sm">
          <span>◷ Takes 5–10 minutes</span>
          <span>♧ No pressure, you can't get it wrong</span>
        </div>
      </div>

      <div className="mt-2 flex min-w-0 flex-col items-center text-center lg:mt-0">
        <Image
          src="/images/robot-mascot.svg"
          alt="AI Tutor robot mascot"
          width={340}
          height={340}
          priority
          className="h-28 w-auto max-w-full object-contain drop-shadow-[0_0_25px_rgba(109,91,255,0.35)] sm:h-36 lg:h-auto lg:w-full lg:max-w-[280px] xl:max-w-[340px]"
        />

        <p className="mt-2 text-xs text-indigo-200 sm:text-sm">
          Small steps. Big progress.
        </p>
      </div>
    </section>
  );
}

type FeatureProps = {
  title: string;
  description: string;
  icon: string;
};

function Feature({
  title,
  description,
  icon,
}: FeatureProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md sm:p-4">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/30 text-2xl text-violet-200">
        {icon}
      </div>

      <h3 className="text-sm font-semibold text-white sm:text-base">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-relaxed text-indigo-100/80 sm:text-sm">
        {description}
      </p>
    </div>
  );
}