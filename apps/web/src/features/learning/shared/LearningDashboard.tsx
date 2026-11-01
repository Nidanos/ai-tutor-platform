import type { CourseTopicGroup } from "@/lib/courses";
import TopicPathList from "./TopicPathList";
import LearningProgressAside from "./LearningProgressAside";
type Props = { topics: CourseTopicGroup[]; completed: string[]; onOpenTopic: (index: number) => void };
export default function LearningDashboard({ topics, completed, onOpenTopic }: Props) {
  const total = topics.reduce((sum, topic) => sum + topic.subtopics.length, 0);
  return <div className="grid items-start gap-5 xl:grid-cols-[1.7fr_.85fr]"><TopicPathList topics={topics} completed={completed} onOpenTopic={onOpenTopic}/><LearningProgressAside completed={completed.length} total={total} onStart={() => onOpenTopic(0)}/></div>;
}
