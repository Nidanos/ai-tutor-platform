import { useState } from "react";
import type { CourseTopicGroup } from "@/lib/courses";

/** Tabs used by the reusable lesson view across both supported courses. */
export type LearningTab = "lesson" | "resources" | "practice";
export type LearningScreen = 1 | 2 | 3;

/** Navigation state is shared between C++ Basics and DSA; course data is passed in. A known
 *  initialSubtopic (from search) opens its lesson directly. */
export function useCourseLearning(topics: CourseTopicGroup[], onBack?: () => void, initialSubtopic?: string) {
  const initialTopic = topics.findIndex((topic) => initialSubtopic && topic.subtopics.includes(initialSubtopic));
  const [screen, setScreen] = useState<LearningScreen>(initialTopic >= 0 ? 3 : 1);
  const [selectedTopic, setSelectedTopic] = useState(Math.max(initialTopic, 0));
  const [selectedSubtopic, setSelectedSubtopic] = useState(initialTopic >= 0 ? initialSubtopic! : topics[0]?.subtopics[0] ?? "");
  const [tab, setTab] = useState<LearningTab>("lesson");

  function openTopic(index: number) {
    setSelectedTopic(index);
    setScreen(2);
  }

  function selectSubtopic(name: string) {
    setSelectedSubtopic(name);
    setTab("lesson");
    setScreen(3);
  }

  function goBack() {
    if (screen === 1) onBack?.();
    else if (screen === 3) setScreen(2);
    else setScreen(1);
  }

  // Completion is deliberately not stored here. The authenticated API is authoritative for skill status.
  return { screen, setScreen, selectedTopic, setSelectedTopic, selectedSubtopic, tab, setTab, openTopic, selectSubtopic, goBack };
}
