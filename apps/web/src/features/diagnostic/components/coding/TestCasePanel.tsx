import { Terminal } from "lucide-react";

export type TestCase = {
  input: string;
  output: string;
};

type TestCasePanelProps = {
  examples: TestCase[];
  activeCase: number;
  onSelectCase: (index: number) => void;
};

export default function TestCasePanel({
  examples,
  activeCase,
  onSelectCase,
}: TestCasePanelProps) {
  const selectedExample = examples[activeCase];

  return (
    <section className="border-t border-white/10 bg-panel text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Terminal size={17} className="text-indigo-300" />

        <h3 className="text-sm font-semibold">
          Sample Test Cases
        </h3>

        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-indigo-200">
          {examples.length}
        </span>
      </div>

      {examples.length === 0 ? (
        <p className="p-4 text-sm text-indigo-200/70">
          No sample test cases are available.
        </p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3">
            {examples.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectCase(index)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${
                  activeCase === index
                    ? "bg-violet-500/20 text-violet-200"
                    : "text-indigo-200 hover:bg-white/5"
                }`}
              >
                Example {index + 1}
              </button>
            ))}
          </div>

          {selectedExample && (
            <div className="space-y-4 p-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  Input
                </p>

                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-code p-3 font-mono text-sm text-slate-200">
                  {selectedExample.input}
                </pre>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  Expected Output
                </p>

                <pre className="overflow-x-auto rounded-lg border border-white/10 bg-code p-3 font-mono text-sm text-slate-200">
                  {selectedExample.output}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}