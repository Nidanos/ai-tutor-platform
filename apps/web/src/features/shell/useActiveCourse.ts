import { useAuth } from "@/features/auth/AuthProvider";
import { DEFAULT_COURSE, getCourse } from "@/lib/courses";

/** The course of the learner's latest finished placement test (GET /auth/me), C++ Basics before the first. */
export function useActiveCourse() {
  const { user } = useAuth();
  return getCourse(user?.placementCourse ?? DEFAULT_COURSE);
}
