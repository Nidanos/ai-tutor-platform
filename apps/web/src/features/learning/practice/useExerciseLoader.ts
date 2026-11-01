import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getExercise, getNextRecommendation } from "@/lib/api/learning";
import type { Attempt, CourseSlug, Exercise } from "@ai-tutor/types";

export function useExerciseLoader(courseSlug: CourseSlug, initialExerciseId?: string) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const useInitial = useRef(Boolean(initialExerciseId));
  const mounted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setExercise(null); setAttempt(null); setAnswer("");
    try {
      let exerciseId = initialExerciseId && useInitial.current ? initialExerciseId : undefined;
      if (!exerciseId) {
        const next = await getNextRecommendation(courseSlug);
        if (!next.recommendation) {
          const prerequisites = next.waitingFor.map((item) => item.skill.name);
          setError(prerequisites.length
            ? `Complete these prerequisites first: ${prerequisites.join(", ")}.`
            : "This course is complete. No further exercise is currently recommended.");
          return;
        }
        exerciseId = next.recommendation.exerciseId ?? undefined;
        if (!exerciseId) { setError("A verified exercise for this skill is being prepared. Please check again shortly."); return; }
      }
      const opened = await getExercise(exerciseId);
      if (!mounted.current) return;
      setExercise(opened.exercise); setAttempt(opened.attempt); // Rung 1 shows its program to read (starterCode); the answer is the predicted output.
      setAnswer(opened.exercise.rung === 1 ? "" : opened.exercise.starterCode ?? "");
      useInitial.current = false;
    } catch (cause) {
      if (mounted.current) setError(cause instanceof ApiError ? cause.body.message : "Couldn't load the exercise. Please try again.");
    } finally { if (mounted.current) setLoading(false); }
  }, [courseSlug, initialExerciseId]);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => { mounted.current = false; window.clearTimeout(timer); };
  }, [load]);

  return { exercise, attempt, answer, setAnswer, setAttempt, loading, error, load };
}
