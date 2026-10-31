import {
  ArrowRight,
  Play,
  GraduationCap,
  Code2,
  Brain,
} from "lucide-react";

const features = [
  { icon: GraduationCap, title: "Personalized", subtitle: "learning" },
  { icon: Code2, title: "Hands-on", subtitle: "practice" },
  { icon: Brain, title: "Designed for", subtitle: "independence" },
];

function HeroSection() {
  return (
    <section className="relative mx-auto flex min-h-[650px] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">

      {/* Left decorative text */}
      <div className="absolute left-5 top-32 hidden -rotate-12 text-sm text-white md:block lg:left-10">
        <p>Not just</p>
        <p>answers.</p>
        <p>Real progress.</p>
        <span className="ml-8">↘</span>
      </div>

      {/* Right decorative text */}
      <div className="absolute right-5 top-32 hidden rotate-6 text-sm text-white md:block lg:right-10">
        <p>Practice today.</p>
        <p>Build tomorrow.</p>
        <p className="mt-1 text-3xl font-bold text-yellow-300">〰</p>
      </div>

      {/* Main hero content */}
      <div className="relative z-10 max-w-3xl">

        <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.35em] text-indigo-200">
          An Independent Learning System
        </p>

        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          Learn to code with AI.
          <br />
          Then{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            without it.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
          Practice with guidance, build real understanding,
          and gradually rely less on AI — so the skill stays with you.
        </p>

        {/* Action buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400"
          >
            Get Started <ArrowRight size={16} />
          </a>

          <a
            href="#features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-indigo-200"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700">
              <Play size={13} fill="currentColor" />
            </span>
            Watch Demo
          </a>
        </div>

        {/* Feature indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-7">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="flex items-center gap-2 text-left"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/20 text-white">
                  <Icon size={20} />
                </div>

                <div className="text-[11px] leading-4 text-white">
                  <p>{feature.title}</p>
                  <p>{feature.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default HeroSection;