import type { Verdict } from "@ai-tutor/types";

export const VERDICT_TEXT: Record<Verdict, string> = {
  AC: "All tests passed",
  WA: "Wrong answer",
  CE: "Doesn't compile",
  RE: "Your program crashed",
  TLE: "The solution took too long",
  MLE: "The solution used too much memory",
  SE: "The checker had a problem; please submit again",
};
