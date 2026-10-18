// The hint ladder (SRS UC-5): 1 Concept · 2 Location · 3 Mechanism · 4 Worked example · 5 Answer.
// Levels 1–4 are written by the LLM; level 5 is always the frozen answer, never generated.
export const HINT_PROMPT_VERSION = "hint-v1";

export const LEVELS: Record<number, string> = {
  1: "CONCEPT: name the idea or C++ feature they need, in words. Don't say where or how.",
  2: "LOCATION: point to the exact place in their code that is wrong or missing (a line or a statement). Don't give the fix.",
  3: "MECHANISM: explain in words how to fix it. At most one short line of code, and never a line of the reference.",
  4: "WORKED EXAMPLE: solve a DIFFERENT, smaller problem that uses the same technique, in at most 5 lines of code. Then say how it relates.",
};

// When neither the live tutor nor a stored hint is available.
export const GENERIC: Record<number, string> = {
  1: "Re-read the task and list what goes in and what must come out. Which C++ feature turns one into the other?",
  2: "Run the example by hand, line by line, and write down each variable's value. Where does it first differ from what you expect?",
  3: "Change one thing at a time and run again. Check the edge cases: zero, negatives, one item, the largest input.",
  4: "Solve a tiny version of the task first (one or two inputs), then grow it to the full task.",
};

export const SYSTEM = `You are a patient Socratic tutor for a beginner learning C++.
Give exactly ONE hint, at the level you are asked for, about the learner's own code.
Never write the solution, and never copy or paraphrase code from the PRIVATE reference.
For a "predict the output" task, never state the output.
At most 80 words, Markdown, no greeting, no "great question".`;

export type HintTask = { rung: number; promptMd: string; starterCode: string; referenceSolution: string };

// Rung 1 asks for the program's output; the learner's "code" is then their typed prediction.
export function hintPrompt(task: HintTask, level: number, learnerCode: string | undefined, lastResult: string | undefined) {
  const predict = task.rung === 1;
  return [
    `TASK (${predict ? "predict the output of this program" : "write the code"}):\n${task.promptMd}`,
    predict ? `PROGRAM:\n${task.starterCode}` : `STARTER CODE:\n${task.starterCode}`,
    `LEARNER'S ${predict ? "PREDICTION" : "CODE"}:\n${learnerCode?.trim() || "(nothing yet)"}`,
    `LAST RESULT:\n${lastResult ?? "(not run yet)"}`,
    `PRIVATE REFERENCE (never reveal):\n${task.referenceSolution}`,
    `HINT LEVEL ${level}: ${LEVELS[level]}`,
  ].join("\n\n");
}

// Level 5 shows the answer: the output for rung 1, a model solution otherwise.
export const answerHint = (task: HintTask, firstOutput: string) =>
  task.rung === 1
    ? `It prints:\n\n\`\`\`\n${firstOutput}\n\`\`\`\n\nTrace it again line by line and find where your prediction went a different way.`
    : `Here is one solution. Read it, then close it and write your own version from memory.\n\n\`\`\`cpp\n${task.referenceSolution}\`\`\``;
