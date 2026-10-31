"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, CourseSlug } from "@ai-tutor/types";
import { COURSE_OPTIONS, DEFAULT_COURSE } from "@/lib/courses";
import { startSession } from "../api";
import DashboardHeader from "./DashboardHeader";
import CourseSelector from "./CourseSelector";
import NextStepCard from "./NextStepCard";
import ProgressCard from "./ProgressCard";
import SessionCard from "./SessionCard";
import { useDashboardData } from "../useDashboardData";

type Props = { user: AuthUser; onLogout: () => Promise<void> };

export default function DashboardHome({ user, onLogout }: Props) {
  const [course, setCourse] = useState<CourseSlug>(DEFAULT_COURSE);
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const data = useDashboardData(course);
  const title = COURSE_OPTIONS.find((item) => item.slug === course)?.title ?? course;

  async function handleStartSession() {
    try {
      setActionError("");
      const { session } = await startSession(course);
      if (session.step) router.push(`/exercise/${session.step.exerciseId}`);
      else await data.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not start your session.");
    }
  }

  return <main className="mx-auto min-h-screen max-w-7xl space-y-6 bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
    <DashboardHeader displayName={user.displayName} onLogout={onLogout} />
    <CourseSelector value={course} onChange={setCourse} />
    {actionError && <p role="alert" className="rounded-xl border border-rose-400/30 p-3 text-sm text-rose-300">{actionError}</p>}
    <section className="grid gap-5 lg:grid-cols-2">
      <NextStepCard data={data} courseTitle={title} onOpen={(id) => router.push(`/exercise/${id}`)} />
      <ProgressCard data={data} onOpen={() => router.push(`/progress?course=${course}`)} />
    </section>
    <SessionCard data={data} onStart={handleStartSession}
      onOpen={(id) => router.push(`/exercise/${id}`)} />
  </main>;
}
