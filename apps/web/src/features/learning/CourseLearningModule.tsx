import type { CourseSlug } from "@ai-tutor/types";
import { getCourse } from "@/lib/courses";
import { useCourseLearning } from "./hooks/useCourseLearning";
import { useCourseProgress } from "./hooks/useCourseProgress";
import CoursePracticePanel from "./CoursePracticePanel";
import LearningDashboard from "./shared/LearningDashboard";
import LearningHeader from "./shared/LearningHeader";
import LearningNavigation from "./shared/LearningNavigation";
import LessonTabs from "./shared/LessonTabs";
import ResourcesTab from "./shared/ResourcesTab";
import SubtopicsList from "./shared/SubtopicsList";
import LessonContent from "./shared/LessonContent";

type Props = { courseSlug: CourseSlug; initialSubtopic?: string; onBack?: () => void };
/** One course-independent learning engine; only metadata varies between subjects. */
export default function CourseLearningModule({ courseSlug, initialSubtopic, onBack }: Props) {
  const course = getCourse(courseSlug);
  const learning = useCourseLearning(course.topics, onBack, initialSubtopic);
  const data = useCourseProgress(courseSlug);
  const topic = course.topics[learning.selectedTopic] ?? course.topics[0];
  // Subtopics are the seeded skill names, so a name finds the skill in GET /progress.
  const selectedSkill = data.progress?.skills.find((item) => item.skill.name === learning.selectedSubtopic);
  const cleared = new Set(data.progress?.skills.filter((item) => item.status === "cleared").map((item) => item.skill.name));
  const completed = course.topics.flatMap((group) => group.subtopics).filter((name) => cleared.has(name));

  return <div className="mx-auto min-w-0 max-w-[1600px] space-y-6 pb-8 text-white">
    <LearningHeader screen={learning.screen} topicName={topic.name} topicDescription={topic.description} selectedSubtopic={learning.selectedSubtopic} courseTitle={course.shortTitle} onBack={learning.goBack}/>
    {learning.screen === 1 && <LearningDashboard topics={course.topics} completed={completed} onOpenTopic={learning.openTopic}/>}
    <LearningNavigation screen={learning.screen} onBack={learning.goBack} onGoToPractice={() => learning.setTab("practice")} onStartFirstSubtopic={() => learning.selectSubtopic(topic.subtopics[0] ?? "")}/>
    {learning.screen === 2 && <SubtopicsList topicName={topic.name} subtopics={topic.subtopics} completed={completed} onOpenSubtopic={learning.selectSubtopic}/>}
    {learning.screen === 3 && <><LessonTabs activeTab={learning.tab} onChange={learning.setTab}/>
      {learning.tab === "lesson" && <LessonContent skill={selectedSkill} skillName={learning.selectedSubtopic} error={data.error} loading={data.loading} onRetry={data.retry} onPractice={() => learning.setTab("practice")}/>}
      {learning.tab === "resources" && <ResourcesTab selectedSubtopic={learning.selectedSubtopic} resources={course.resources} onContinue={() => learning.setTab("practice")}/>}
      {learning.tab === "practice" && <CoursePracticePanel courseSlug={courseSlug}/>}
    </>}
  </div>;
}
