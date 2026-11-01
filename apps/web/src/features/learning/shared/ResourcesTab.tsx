
import { ArrowRight, ExternalLink, FileText, Target } from "lucide-react";
import InfoCard from "./InfoCard";

type Resource = {
  title: string;
  description: string;
  url: string;
};

type Props = {
  selectedSubtopic: string;
  resources: Resource[];
  onContinue: () => void;
};

export default function ResourcesTab({
  selectedSubtopic,
  resources,
  onContinue,
}: Props) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-2xl border border-blue-800/80 bg-gradient-to-br from-blue-950/90 to-indigo-950/80 p-5 sm:p-6">
        <h2 className="flex items-center gap-3 text-xl font-bold">
          <FileText className="text-purple-400" />
          Learning Resources
        </h2>
        <p className="mt-3 leading-7 text-blue-200">
          Use these resources to understand {selectedSubtopic}. Read the
          explanation, trace the examples, and try the code yourself.
        </p>
        <div className="mt-5 space-y-3">
          {resources.map((resource) => (
            <a
              key={resource.title}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-blue-800 bg-blue-950/60 p-4 hover:border-purple-500"
            >
              <FileText className="shrink-0 text-purple-400" />
              <span className="flex-1">
                <span className="block font-semibold">{resource.title}</span>
                <span className="mt-1 block text-sm text-blue-300">
                  {resource.description}
                </span>
              </span>
              <ExternalLink size={17} />
            </a>
          ))}
        </div>
      </section>

      <div className="space-y-5">
        <InfoCard title="What You'll Learn" icon={<Target />}>
          <ul className="list-disc space-y-2 pl-5">
            <li>Understand the concept and when to use it.</li>
            <li>Trace the worked example line by line.</li>
            <li>Spot the common mistakes before you make them.</li>
          </ul>
        </InfoCard>
        <button
          onClick={onContinue}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 font-semibold transition hover:brightness-110"
        >
          Continue to Practice <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
