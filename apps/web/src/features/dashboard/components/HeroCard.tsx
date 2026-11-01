import { Icon } from "@/components/ui/Icon";

const benefits = [
  { icon: 'bolt' as const, title: 'Hands-on practice', text: 'Write real code', color: 'text-emerald-300 bg-emerald-400/20' },
  { icon: 'book' as const, title: 'Build understanding', text: 'Step by step', color: 'text-violet-200 bg-violet-400/25' },
  { icon: 'chart' as const, title: 'Get better', text: 'Track your progress', color: 'text-rose-200 bg-rose-400/25' },
]

function CodePreview() {
  return <div className="relative hidden rotate-[-2deg] rounded-2xl border border-indigo-300/50 bg-[#10172d] p-4 shadow-2xl shadow-violet-950/40 md:block">
    <div className="mb-4 flex gap-2"><i className="size-2.5 rounded-full bg-rose-400"/><i className="size-2.5 rounded-full bg-amber-300"/><i className="size-2.5 rounded-full bg-lime-400"/></div>
    <code className="text-xs leading-6 text-indigo-200 sm:text-sm"><span className="text-violet-300">#include</span> &lt;iostream&gt;<br/><span className="text-violet-300">int</span> main() &#123;<br/><span className="pl-4 text-violet-300">std::cout</span> &lt;&lt; <span className="text-emerald-300">"Keep learning"</span>;<br/>&#125;</code>
  </div>
}

function BenefitRow() {
  return <div className="mt-8 grid gap-4 sm:grid-cols-3">{benefits.map((item) => <div key={item.title} className="flex items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.color}`}><Icon name={item.icon}/></span><span className="min-w-0"><strong className="block text-xs sm:text-sm">{item.title}</strong><small className="text-xs text-indigo-200/70">{item.text}</small></span></div>)}</div>
}

type NextStep = { title: string; description: string; skillId: string; actionLabel: string };

interface HeroCardProps {
  nextStep: NextStep;
  onStart: () => void;
}

export default function HeroCard({
  nextStep,
  onStart,
}: HeroCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-blue-400/30 bg-[radial-gradient(ellipse_at_82%_20%,rgba(124,58,237,0.48),transparent_45%),radial-gradient(ellipse_at_12%_90%,rgba(37,99,235,0.32),transparent_48%),linear-gradient(125deg,#1b3470_0%,#242d68_48%,#352064_100%)] p-6 shadow-xl shadow-violet-950/40 sm:p-8">

      <div className="grid items-center gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-blue-200">
            ⚑ YOUR NEXT STEP
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            {nextStep.title}
          </h2>
          <p className="mt-2 text-indigo-100/85">
            {nextStep.description}
          </p>
          
<button
  type="button"
  onClick={onStart}
  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3 font-semibold shadow-lg shadow-blue-950/30"
>
  {nextStep.actionLabel}
  <Icon name="arrow" size={18} />
</button>

        </div>
        <div className="relative">
          <p className="mb-3 text-right font-serif text-sm italic text-violet-200">
            Practice today.
            <br />
            Build tomorrow.
          </p>
          <CodePreview />
        </div>
      </div>
      <BenefitRow />
    </article>
  );
}
