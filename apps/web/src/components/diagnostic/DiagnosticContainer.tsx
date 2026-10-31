"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import DiagnosticComplete from "@/components/diagnostic/DiagnosticComplete";
import DiagnosticHeader from "@/components/diagnostic/DiagnosticHeader";
import DiagnosticIntro from "@/components/diagnostic/DiagnosticIntro";
import ProgressStepper from "@/components/diagnostic/ProgressStepper";
import QuestionCard from "@/components/diagnostic/QuestionCard";
import {
  completeDiagnosticAndWait,
  startDiagnostic,
  submitDiagnosticAnswer,
} from "@/lib/diagnostic/diagnostic.api";
import type {
  DiagnosticAnswerRequest,
  DiagnosticCompleted,
  DiagnosticInProgress,
} from "@/types/diagnostic";

type Screen = "intro" | "assessment" | "complete";
type DiagnosticState = DiagnosticInProgress | DiagnosticCompleted | null;

export default function DiagnosticContainer() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [screen, setScreen] = useState<Screen>("intro");
  const [diagnostic, setDiagnostic] = useState<DiagnosticState>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [isAuthLoading, user, router]);

  async function handleStartDiagnostic() {
    try {
      setIsStarting(true);
      setError(null);

      const response = await startDiagnostic({
        course: "dsa",
        language: "cpp",
        retake: false,
      });

      setDiagnostic(response.diagnostic);
      setSelectedAnswer("");
      setSavedCode(null);
      setScreen(
        response.diagnostic.status === "completed" ? "complete" : "assessment"
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start the diagnostic. Please try again."
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function sendAnswer(request: DiagnosticAnswerRequest) {
    if (!diagnostic || diagnostic.status !== "in_progress" || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await submitDiagnosticAnswer(
        diagnostic.diagnosticId,
        request
      );

      setDiagnostic(response.diagnostic);
      setSelectedAnswer("");
      setSavedCode(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save your response. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!diagnostic || diagnostic.status !== "in_progress") return;

    const question = diagnostic.question;
    if (!question) return;

    const answer =
      question.dimension === "reading" ? selectedAnswer : (savedCode ?? question.code);

    if (!answer.trim()) {
      setError(
        question.dimension === "reading"
          ? "Enter your predicted output before submitting."
          : "Write your C++ solution before submitting."
      );
      return;
    }

    await sendAnswer({ itemId: question.itemId, answer });
  }

  async function handleSkip() {
    if (!diagnostic || diagnostic.status !== "in_progress") return;
    const question = diagnostic.question;
    if (!question) return;

    await sendAnswer({ itemId: question.itemId, dontKnow: true });
  }

  async function handleCompleteDiagnostic() {
    if (!diagnostic || diagnostic.status !== "in_progress" || isCompleting) {
      return;
    }

    try {
      setIsCompleting(true);
      setError(null);

      const results = await completeDiagnosticAndWait(
        diagnostic.diagnosticId
      );

      setDiagnostic(results);
      setScreen("complete");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to complete the diagnostic. Please try again."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  function handleGoToDashboard() {
    router.push("/dashboard");
  }

  if (isAuthLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#172653] px-6 text-indigo-100">
        {isAuthLoading ? "Checking your session..." : "Redirecting to sign in..."}
      </main>
    );
  }

  const currentQuestion =
    diagnostic?.status === "in_progress"
      ? diagnostic.question ?? null
      : null;

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#172653] px-4 py-4 text-white sm:px-6 lg:px-8 lg:py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_35%,rgba(45,100,210,0.3),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(160,65,190,0.24),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex flex-1 flex-col">
        <DiagnosticHeader userName={user.displayName} />

        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center py-5 lg:py-4">
          <ProgressStepper
            currentStep={screen === "intro" ? 1 : screen === "assessment" ? 2 : 4}
          />

          {screen === "intro" && (
            <DiagnosticIntro
              onStart={handleStartDiagnostic}
              isLoading={isStarting}
            />
          )}

          {screen === "assessment" && currentQuestion && (
            <>
              <div className="mx-auto mt-5 flex w-full max-w-[1440px] items-center justify-between gap-4">
                <p className="text-sm text-indigo-200">
                  Question {diagnostic?.status === "in_progress" ? diagnostic.answered + 1 : ""}
                </p>
                <button
                  type="button"
                  onClick={handleCompleteDiagnostic}
                  disabled={isSubmitting || isCompleting}
                  className="rounded-lg border border-indigo-300/40 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCompleting ? "Generating results..." : "Finish assessment"}
                </button>
              </div>

              <QuestionCard
                question={currentQuestion}
                selectedAnswer={selectedAnswer}
                savedCode={savedCode}
                onCodeChange={setSavedCode}
                onSelectAnswer={setSelectedAnswer}
                onContinue={handleSubmitAnswer}
                onSkip={handleSkip}
                isBusy={isSubmitting || isCompleting}
              />
            </>
          )}

          {screen === "assessment" && !currentQuestion && (
            <div className="mx-auto mt-10 max-w-xl text-center rounded-2xl border border-indigo-300/20 bg-white/[0.045] p-7">
              <h2 className="text-2xl font-bold text-white">
                Assessment questions completed
              </h2>
              <p className="mt-3 text-indigo-200">
                Submit your assessment to generate your diagnostic results.
              </p>
              <button
                type="button"
                onClick={handleCompleteDiagnostic}
                disabled={isCompleting || isSubmitting}
                className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCompleting ? "Generating Results..." : "Complete Assessment"}
              </button>
            </div>
          )}

          {screen === "complete" && diagnostic?.status === "completed" && (
            <DiagnosticComplete
              results={diagnostic}
              onFinish={handleGoToDashboard}
            />
          )}

          {error && (
            <div
              role="alert"
              className="mx-auto mt-5 w-full max-w-3xl rounded-xl border border-red-300/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200"
            >
              {error}
            </div>
          )}

          {isSubmitting && (
            <p className="mt-3 text-center text-sm text-indigo-200" aria-live="polite">
              Saving your response...
            </p>
          )}
        </div>

        <footer className="mt-auto border-t border-white/10 py-2 text-center text-xs text-indigo-200/80 sm:text-sm">
          <span className="mx-4 inline-block w-12 border-t border-indigo-300/50 align-middle" />
          Your journey to independent learning starts here.
          <span className="mx-4 inline-block w-12 border-t border-indigo-300/50 align-middle" />
        </footer>
      </div>
    </main>
  );
}
