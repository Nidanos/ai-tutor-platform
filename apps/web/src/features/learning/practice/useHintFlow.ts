import { useState } from "react";
import { requestHint } from "@/lib/api/learning";
import type { Attempt, Exercise, Hint } from "@ai-tutor/types";

export function useHintFlow() {
  const [hints, setHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState(false);
  async function getHint(exercise: Exercise | null, attempt: Attempt | null, answer: string, blocked: boolean, onError: (message: string) => void, onLevel: (level: number) => void) {
    if (!exercise || !attempt || blocked || loading || attempt.hintLevel >= attempt.hintCeiling) return;
    if (attempt.hintLevel + 1 === 5 && !window.confirm("Show the answer? This exercise won't count towards your progress.")) return;
    setLoading(true);
    try { const value = await requestHint(exercise.id, answer); setHints((old) => [...old, value.hint]); onLevel(value.hint.level); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Couldn't load a hint."); }
    finally { setLoading(false); }
  }
  function clear() { setHints([]); }
  return { hints, loading, getHint, clear };
}
