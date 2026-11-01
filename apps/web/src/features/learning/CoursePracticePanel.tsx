import { RefreshCw } from "lucide-react";
import type { CourseSlug } from "@ai-tutor/types";
import ExercisePrompt from "./practice/ExercisePrompt";
import EditorWorkspace from "./practice/EditorWorkspace";
import PracticeActions from "./practice/PracticeActions";
import PracticeFeedback from "./practice/PracticeFeedback";
import HintList from "./practice/HintList";
import { useExerciseLoader } from "./practice/useExerciseLoader";
import { useSubmissionFlow } from "./practice/useSubmissionFlow";
import { useHintFlow } from "./practice/useHintFlow";

type Props = { courseSlug: CourseSlug; initialExerciseId?: string; onBackToLearning?: () => void };
/** Reusable C++ practice view. All execution, attempt state, hint policy and grading remain server-owned. */
export default function CoursePracticePanel({ courseSlug, initialExerciseId, onBackToLearning }: Props) {
  const exerciseState = useExerciseLoader(courseSlug, initialExerciseId);
  const submission = useSubmissionFlow();
  const hint = useHintFlow();
  const attempt = exerciseState.attempt;
  const disabled = submission.view === "submitting" || submission.view === "pending" || attempt?.status !== "active";
  const canSubmit = Boolean(exerciseState.exercise && attempt?.status === "active" && exerciseState.answer.trim() && !disabled && !submission.result);
  const loadNext = async () => { submission.resetForNext(); hint.clear(); await exerciseState.load(); };
  const getHint = () => hint.getHint(exerciseState.exercise, attempt, exerciseState.answer, disabled, submission.setError, (level) => exerciseState.setAttempt((old) => old ? { ...old, hintLevel: level } : old));
  const handleTryAgain = () => { submission.setResult(null); submission.setError(""); submission.setView("ready"); };
  const message = exerciseState.error || submission.error;

  return <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
    <div className="min-w-0 space-y-3"><ExercisePrompt exercise={exerciseState.exercise} courseSlug={courseSlug}/>{attempt && <p className="px-1 text-xs text-blue-300">Hints used: {attempt.hintLevel} / {attempt.hintCeiling}</p>}{onBackToLearning && <button type="button" onClick={onBackToLearning} className="inline-flex items-center gap-2 text-sm text-indigo-200"><RefreshCw size={14}/> Back to learning</button>}</div>
    <article className="min-w-0 overflow-hidden rounded-2xl border border-blue-800/80 bg-[#0c1428]"><EditorWorkspace exercise={exerciseState.exercise} answer={exerciseState.answer} setAnswer={exerciseState.setAnswer} disabled={disabled}/><PracticeActions attempt={attempt} view={exerciseState.loading ? "loading" : submission.view} hintLoading={hint.loading} canSubmit={canSubmit} onHint={() => void getHint()} onSubmit={() => void submission.submit(attempt, exerciseState.answer)}/><PracticeFeedback view={exerciseState.loading ? "loading" : submission.view} error={message} result={submission.result} retryRequest={Boolean(submission.retryRequest)} pendingId={Boolean(submission.pendingId)} onRetry={() => void submission.retry()} onCheck={submission.checkAgain} onReload={() => void loadNext()} onTryAgain={handleTryAgain}/><HintList hints={hint.hints}/>{attempt && attempt.status !== "active" && !submission.result && <div className="mx-4 mb-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100"><p>{attempt.status === "solved" ? "Solved. Nice work!" : "This attempt is no longer active."}</p><button onClick={() => void loadNext()} className="mt-2 underline">Load next recommendation</button></div>}{exerciseState.loading && <p role="status" className="p-4 text-sm text-blue-200">Loading exercise…</p>}{exerciseState.error && <div role="alert" className="p-4 text-sm text-rose-200">{exerciseState.error}<button onClick={() => void loadNext()} className="ml-2 underline">Retry</button></div>}</article>
  </section>;
}
