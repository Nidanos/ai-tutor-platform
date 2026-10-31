import { useState } from "react";

import type { DiagnosticQuestion } from "@/types/diagnostic";

import CodeEditor from "./CodeEditor";
import EditorToolbar from "./EditorToolbar";
import ProblemDescription from "./ProblemDescription";
import TestCasePanel from "./TestCasePanel";

type CodingWorkspaceProps = {
  question: DiagnosticQuestion;
  savedCode: string | null;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isBusy?: boolean;
};

export default function CodingWorkspace({
  question,
  savedCode,
  onCodeChange,
  onSubmit,
  isBusy = false,
}: CodingWorkspaceProps) {
  const [activeCase, setActiveCase] = useState(0);
  const code = savedCode ?? question.code;

  const examples = question.sample
    ? [{
        input: question.sample.input ?? "",
        output: question.sample.expectedOutput,
      }]
    : [];

  return (
    <section className="mx-auto mt-6 w-full max-w-[1440px] overflow-hidden rounded-2xl border border-indigo-300/20 bg-[#111a2e] shadow-2xl shadow-indigo-950/30">
      <div className="grid min-h-[650px] grid-cols-1 lg:grid-cols-2">
        <div className="min-h-[360px] lg:min-h-[650px]">
          <ProblemDescription question={question} />
        </div>
        <div className="flex min-h-[650px] min-w-0 flex-col">
          <EditorToolbar onSubmit={onSubmit} disabled={isBusy || !code.trim()} />
          <div className="h-[420px] min-w-0 shrink-0">
            <CodeEditor
              value={code}
              onChange={onCodeChange}
              height="420px"
            />
          </div>
          <TestCasePanel
            examples={examples}
            activeCase={activeCase}
            onSelectCase={setActiveCase}
          />
        </div>
      </div>
    </section>
  );
}
