
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { LearningScreen } from "../hooks/useCourseLearning";

type Props = {
  screen: LearningScreen;
  onBack: () => void;
  onGoToPractice: () => void;
  onStartFirstSubtopic: () => void;
};

export default function LearningNavigation({
  screen,
  onBack,
  onGoToPractice,
  onStartFirstSubtopic,
}: Props) {
  const primary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 font-semibold transition hover:brightness-110";

  const secondary =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-blue-800 px-4 py-3 text-blue-200 hover:bg-blue-900/50";

  if (screen === 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button onClick={onBack} className={secondary}>
        <ArrowLeft size={17} /> Back
      </button>

      {screen === 3 && (
        <button onClick={onGoToPractice} className={primary}>
          Go to Practice <ArrowRight size={17} />
        </button>
      )}

      {screen === 2 && (
        <button onClick={onStartFirstSubtopic} className={primary}>
          Start First Subtopic <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}
