"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import DashboardHome from "@/features/dashboard/components/DashboardHome";
import { useActiveCourse } from "@/features/shell/useActiveCourse";

// The (dashboard) layout renders this only for a signed-in user.
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const course = useActiveCourse();
  return <DashboardHome courseSlug={course.slug} courseTitle={course.title} displayName={user!.displayName}
    onStartLearning={() => router.push("/learn")}
    onOpenPractice={(id) => router.push(id ? `/practice/${id}` : "/practice")}
    onOpenProgress={() => router.push("/progress")}
    onOpenActiveSession={() => router.push("/session")} />;
}
