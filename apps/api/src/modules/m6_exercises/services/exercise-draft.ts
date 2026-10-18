import { z } from "zod";
import { cppBasicsTemplates, type ExerciseTemplate, predict } from "../../../infrastructure/database/seed/cpp-templates.js";

// What Gemini writes for one exercise (ADR-0016), and how it becomes the same template shape as the
// hand-written bank, so it is verified and stored the same way. Pure: no LLM, no database.
export const GENERATION_PROMPT_VERSION = "exercise-v1";
export const TASK = "Write the function. Hidden tests call it with other inputs too, so don't hard-code the example.";
export const WRONG_SOLUTIONS = 3;

const RUNGS: Record<number, string> = {
  1: "PREDICT: a complete short program (6–12 lines in main, at most 4 output lines). The learner must type its exact output. One trap typical of the skill. Deterministic: no undefined behaviour, no addresses, sizeof, unordered containers or inexact floating-point output.",
  2: "DIAGNOSE: the starter is a full solution with ONE bug typical of the skill. It compiles and fails at least one case. The prompt says what the code should do and that it has a bug to find.",
  3: "COMPLETE: the starter is the solution with one or two key lines replaced by a `// TODO` comment saying what is missing. It compiles.",
  4: "EXTEND: the starter correctly solves a simpler version of the task; the prompt asks the learner to extend it to the full task.",
  5: "BUILD: the starter is only the function with a trivial body (an empty body, or returning a default value). The learner writes all of it.",
};

const code = z.string().min(5).max(5000);
export const predictDraft = z.object({
  title: z.string().min(3).max(80),
  program: z.string().min(20).max(3000),
  expectedOutput: z.string().min(1).max(500),
});
export const writingDraft = z.object({
  title: z.string().min(3).max(80),
  promptMd: z.string().min(20).max(3000),
  functionSignature: z.string().min(5).max(300),
  call: z.string().min(5).max(500).refine((c) => c.includes("{{args}}"), "call must contain {{args}}"),
  starterCode: code,
  reference: code,
  cases: z.array(z.object({ args: z.string().max(500), expected: z.string().min(1).max(2000) })).min(3).max(6),
  wrongSolutions: z.array(code).length(WRONG_SOLUTIONS),
});
export type Draft = z.infer<typeof predictDraft> | z.infer<typeof writingDraft>;

export const draftSchema = (rung: number) => (rung === 1 ? predictDraft : writingDraft);
// Gemini wants the schema itself, without the dialect tag.
export const jsonSchemaFor = (rung: number) => {
  const { $schema, ...schema } = z.toJSONSchema(draftSchema(rung));
  return schema;
};

export type GenerationContext = {
  skill: { slug: string; name: string; description: string | null };
  prerequisites: string[]; // names of every skill below this one: the only other features allowed
  rung: number;
  existingTitles: string[];
  previousFailure?: string; // why the last try was rejected, so this one can fix it
};

export const SYSTEM = `You write one C++20 practice exercise for a beginner, as JSON matching the schema.
It is compiled with clang 19 (-std=c++20 -O2) and checked by running it, so every expected output must be exactly right.
Never mention any website, video creator, book or course provider.`;

// The hand-written exercise of the same rung, as an example of the format.
function exampleFor(rung: number) {
  const t = cppBasicsTemplates.find((x) => x.rung === rung && x.skill === "variables-and-types")!;
  return rung === 1
    ? { title: t.title, program: t.starterCode, expectedOutput: t.cases[0].expected }
    : { title: t.title, promptMd: t.promptMd, functionSignature: t.functionSignature, call: t.call!("{{args}}"), starterCode: t.starterCode, reference: t.reference, cases: t.cases, wrongSolutions: ["…", "…", "…"] };
}

const HARNESS = `The tests run in a frozen harness: \`#include <iostream>\`, \`#include <string>\`, \`#include "solution.cpp"\`, then main() runs ONE statement per test: your \`call\` with {{args}} replaced by that case's args.
- \`call\` is one C++ statement that calls the function and prints the result with std::cout, ending with "\\n". Wrap declarations in braces: \`{ auto r = f({{args}}); std::cout << r << "\\n"; }\`.
- Any header beyond <iostream> and <string> must be #included in starterCode, reference AND every wrong solution.`;

const WRITING_RULES = `- functionSignature is exactly the function's first line in the code.
- reference: at most 10 lines of function body, idiomatic.
- cases: 3–5. The first is shown to the learner as the example, so its args must read naturally (e.g. "{1, -2, 4}" or "12, 18"). Include at least one edge case (zero, empty, negative, one item, as fits). expected is exactly what \`call\` prints.
- wrongSolutions: exactly ${WRONG_SOLUTIONS} complete versions of the solution file, each with a different common mistake for this skill. Each must compile and fail at least one case.
- promptMd: the task, the exact return value or printed format, and one example matching the first case.`;

export function generationPrompt(c: GenerationContext) {
  const parts = [
    `SKILL: ${c.skill.name}${c.skill.description ? `: ${c.skill.description}` : ""}`,
    `USE ONLY this skill and: ${c.prerequisites.length ? c.prerequisites.join(", ") : "basic program structure"}.`,
    `RUNG ${c.rung}. ${RUNGS[c.rung]}`,
    c.rung === 1
      ? "Write a complete program with its #includes. expectedOutput is exactly what it prints (it is checked by running it). Title: \"What does it print? <topic>\"."
      : `${HARNESS}\n\n${WRITING_RULES}`,
    c.existingTitles.length ? `Make it different from the existing exercises: ${c.existingTitles.join("; ")}.` : "",
    `EXAMPLE of the format (a different skill):\n${JSON.stringify(exampleFor(c.rung), null, 1)}`,
    c.previousFailure ? `Your previous draft was rejected: ${c.previousFailure}. Fix that.` : "",
  ];
  return parts.filter(Boolean).join("\n\n");
}

// The draft as a template, so the bank's harness, verification and storage apply unchanged.
export function toTemplate(draft: Draft, rung: number, skillSlug: string): ExerciseTemplate {
  if ("program" in draft) {
    const title = draft.title.startsWith("What does it print?") ? draft.title : `What does it print? ${draft.title}`;
    return predict(skillSlug, title, draft.program, draft.expectedOutput);
  }
  return {
    skill: skillSlug,
    rung: rung as ExerciseTemplate["rung"],
    title: draft.title,
    promptMd: `${draft.promptMd}\n\n${TASK}`,
    functionSignature: draft.functionSignature,
    call: (args) => draft.call.replaceAll("{{args}}", args),
    starterCode: draft.starterCode,
    reference: draft.reference,
    cases: draft.cases,
  };
}
