"use client";

import { useRouter } from "next/navigation";
import SkillProgressPage from "@/features/learning/SkillProgressPage";
import { useActiveCourse } from "@/features/shell/useActiveCourse";

export default function Page() {
  const router = useRouter();
  const course = useActiveCourse();
  return <SkillProgressPage courseSlug={course.slug} courseTitle={course.title} onBack={() => router.push("/dashboard")} />;
}
