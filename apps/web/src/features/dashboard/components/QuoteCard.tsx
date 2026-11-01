
import { Icon } from "@/components/ui/Icon";

type Props = {
  quote: string;
};

export default function QuoteCard({ quote }: Props) {
  return (
    <article className="flex min-h-32 items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.045] px-6 py-5 text-violet-200">
      <Icon
        name="quote"
        size={36}
        className="-translate-y-3 shrink-0 text-violet-400"
      />
      <div>
        <p className="text-lg leading-7">{quote}</p>
        <div className="mt-3 h-0.5 w-10 bg-violet-300" />
      </div>
    </article>
  );
}
