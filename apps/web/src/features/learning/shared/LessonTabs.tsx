
import type { LearningTab } from "../hooks/useCourseLearning";

type Props = {
  activeTab: LearningTab;
  onChange: (tab: LearningTab) => void;
};

const tabs: { id: LearningTab; label: string }[] = [
  { id: "lesson", label: "Lesson" },
  { id: "resources", label: "Further Reading" },
  { id: "practice", label: "Practice" },
];

export default function LessonTabs({
  activeTab,
  onChange,
}: Props) {
  return (
    <nav
      aria-label="Lesson sections"
      className="grid grid-cols-3 gap-2 rounded-xl border border-blue-800 bg-blue-950/60 p-2"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={activeTab === tab.id}
          className={`rounded-lg px-3 py-3 text-sm font-semibold ${
            activeTab === tab.id
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              : "text-blue-200 hover:bg-blue-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
