"use client";

import { useRouter } from "next/navigation";
import { useActiveCourse } from "@/features/shell/useActiveCourse";
import CourseLearningModule from "./CourseLearningModule";

// A new search result remounts the module, so it opens the lesson that was searched for.
export default function LearnScreen({ skill }: { skill?: string }) {
  const router = useRouter();
  const course = useActiveCourse();
  return <CourseLearningModule key={`${course.slug}:${skill ?? ""}`} courseSlug={course.slug} initialSubtopic={skill} onBack={() => router.push("/dashboard")} />;
}
