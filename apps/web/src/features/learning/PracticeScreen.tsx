"use client";

import { useRouter } from "next/navigation";
import { useActiveCourse } from "@/features/shell/useActiveCourse";
import CoursePracticePanel from "./CoursePracticePanel";

// Without an exercise id, the panel opens the next recommended exercise.
export default function PracticeScreen({ exerciseId }: { exerciseId?: string }) {
  const router = useRouter();
  const course = useActiveCourse();
  return <CoursePracticePanel key={exerciseId ?? "recommended"} courseSlug={course.slug} initialExerciseId={exerciseId} onBackToLearning={() => router.push("/learn")} />;
}
