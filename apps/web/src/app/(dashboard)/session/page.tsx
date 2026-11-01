"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import ActiveSessionPage from "@/features/learning/ActiveSessionPage";
import { useActiveCourse } from "@/features/shell/useActiveCourse";

// Full screen, without the sidebar, as in the team's design.
export default function SessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const course = useActiveCourse();
  return <ActiveSessionPage courseSlug={course.slug} displayName={user!.displayName}
    onBack={() => router.push("/dashboard")}
    onOpenExercise={(id) => router.push(`/practice/${id}`)} />;
}
