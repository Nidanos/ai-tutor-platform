
import { ArrowLeft } from "lucide-react";
import type { LearningScreen } from "../hooks/useCourseLearning";

type Props = {
  screen: LearningScreen;
  topicName: string;
  topicDescription: string;
  selectedSubtopic: string;
  courseTitle: string;
  onBack: () => void;
};

export default function LearningHeader({
  screen,
  topicName,
  topicDescription,
  selectedSubtopic,
  courseTitle,
  onBack,
}: Props) {
  const title =
    screen === 1
      ? `${courseTitle} Learning Path`
      : screen === 2
        ? topicName
        : selectedSubtopic;

  const description =
    screen === 1
      ? `Build your ${courseTitle} skills step by step.`
      : screen === 2
        ? topicDescription
        : "Explore the concepts, review examples, and practise your skills.";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-blue-300">
          Learn / {courseTitle}{screen > 1 ? ` / ${topicName}` : ""}
          {screen > 2 ? ` / ${selectedSubtopic}` : ""}
        </p>

        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
          {title}
        </h1>

        <p className="mt-2 text-blue-200">{description}</p>
      </div>

      <button
        onClick={onBack}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-800 px-4 py-3 text-blue-200 hover:bg-blue-900/50"
      >
        <ArrowLeft size={18} />
        {screen === 1 ? "Back to Dashboard" : "Back"}
      </button>
    </div>
  );
}
