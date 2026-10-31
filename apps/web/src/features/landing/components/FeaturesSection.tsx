import { Lightbulb, Play, ArrowRight } from "lucide-react";
import FeatureCard from "./FeatureCard";

function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-20"
    >
      {/* Section Introduction */}
      <div className="mb-10 grid gap-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-200">
            Our Features
          </p>

          <h2 className="max-w-lg text-3xl font-bold leading-tight text-white md:text-4xl">
            Everything you need to learn{" "}
            <span className="text-indigo-300">
              independently.
            </span>
          </h2>
        </div>

        <p className="max-w-md text-sm leading-6 text-indigo-100 md:justify-self-end">
          A complete learning experience designed to help you
          think, practice, and grow — with the right level of AI
          support, at the right time.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Personalized Learning */}
        <FeatureCard
          label="Personalized Learning"
          title="Find Your Starting Point"
          description="A quick diagnostic to understand where you are and what to focus on."
          tone="green"
        >
          <div className="w-full rounded-xl bg-white/80 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800">
                Your Skill Assessment
              </span>

              <span className="rounded-full bg-lime-200 px-2 py-1 text-[9px] font-semibold text-lime-900">
                In Progress
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-700">
                <span>JavaScript Fundamentals</span>
                <span className="font-semibold">70%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[70%] rounded-full bg-lime-500" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-700">
                <span>Problem Solving</span>
                <span className="font-semibold">45%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[45%] rounded-full bg-lime-500" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-lg bg-lime-100 px-2 py-2">
              <span className="text-sm">✦</span>

              <span className="text-[10px] font-semibold text-slate-800">
                Your learning path is taking shape
              </span>
            </div>
          </div>
        </FeatureCard>

        {/* Hands-on Practice */}
        <FeatureCard
          label="Hands-on Practice"
          title="Learn by Doing"
          description="Practice with real exercises and build your skills step by step."
          tone="pink"
        >
          <div className="w-full rounded-xl bg-slate-900 p-4 text-left text-xs text-slate-200 shadow-xl">
            <p className="font-mono leading-5">
              {"// your turn"}
              <br />
              function solve() {"{"}
              <br />
              &nbsp;&nbsp;// ...
              <br />
              {"}"}
            </p>

            <div className="mt-3 flex justify-end">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-2 font-semibold text-white">
                <Play size={12} fill="currentColor" />
                Run
              </span>
            </div>
          </div>
        </FeatureCard>

        {/* Guided Support */}
        <FeatureCard
          label="Guided Support"
          title="Get Help, Not Answers"
          description="Receive structured hints when you're stuck — so you keep thinking."
          tone="purple"
        >
          <div className="flex w-full flex-col gap-2 text-left text-[10px] font-semibold text-slate-800">
            <div className="flex items-center gap-2 rounded-lg bg-white/90 p-3">
              <Lightbulb size={13} className="text-amber-500" />
              Think about the edge cases...
            </div>

            <div className="rounded-lg bg-white/90 p-3">
              ▣ Try a smaller example.
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-white/90 p-3">
              <ArrowRight size={12} />
              You're on the right track!
            </div>
          </div>
        </FeatureCard>

      </div>
    </section>
  );
}

export default FeaturesSection;