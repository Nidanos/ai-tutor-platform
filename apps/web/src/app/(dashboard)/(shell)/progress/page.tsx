"use client";

import { useRouter } from "next/navigation";
import ProgressPage from "@/features/progress/ProgressPage";
import { useActiveCourse } from "@/features/shell/useActiveCourse";

export default function Page() {
  const router = useRouter();
  const course = useActiveCourse();
  return <ProgressPage courseSlug={course.slug} courseTitle={course.title}
    onContinueLearning={() => router.push("/learn")}
    onViewSkillProgress={() => router.push("/progress/skills")} />;
}
