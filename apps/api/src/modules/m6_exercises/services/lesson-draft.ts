import { z } from "zod";

// What Gemini writes for one lesson (ADR-0019), the level it is written for, and the prompt.
// Pure: no LLM, no database.
export const LESSON_PROMPT_VERSION = "lesson-v1";
export const LEVELS = ["new", "building", "strong"] as const;
export type Level = (typeof LEVELS)[number];
const STRONG_FROM = 0.7; // the writing score that unlocks the next skills (ADR-0011)

// The learner's level on a skill, from today's scores: never practised, building it up, or strong.
export function levelFor(state: { reading: number; writing: number; cleared: boolean }): Level {
  if (state.cleared || state.writing >= STRONG_FROM) return "strong";
  return state.reading > 0 || state.writing > 0 ? "building" : "new";
}

const FOR_LEVEL: Record<Level, string> = {
  new: "The learner has not used this skill yet. Start from the intuition and why it matters, define every new term, show the simplest correct use, and keep to the core idea: no advanced variations.",
  building:
    "The learner knows the idea but still makes mistakes using it. Give a short recap, then how to apply it correctly step by step on a typical task, with extra care on the mistakes learners at this stage make.",
  strong:
    "The learner can already use this skill. Go deeper: edge cases, what it costs in time and memory, variations, and the idiomatic or efficient way to write it. Use a more demanding example.",
};

// A Mermaid diagram the web app can draw: one of the types it supports, and no init directives.
const DIAGRAM_TYPES = /^(flowchart|graph|sequenceDiagram|stateDiagram-v2|classDiagram)\b/;
const program = (maxLines: number) =>
  z
    .string()
    .min(30)
    .max(4000)
    .refine((code) => code.includes("int main"), "must be a complete program with main()")
    .refine((code) => code.split("\n").length <= maxLines, `must be at most ${maxLines} lines`);

export const lessonDraft = z.object({
  explanationMd: z.string().min(400).max(6000),
  diagram: z
    .string()
    .min(20)
    .max(2000)
    .refine((d) => DIAGRAM_TYPES.test(d.trim()), "diagram must start with flowchart, graph, sequenceDiagram, stateDiagram-v2 or classDiagram")
    .refine((d) => !d.includes("%%{"), "diagram must not use init directives"),
  example: z.object({ code: program(45), output: z.string().min(1).max(1000), walkthroughMd: z.string().min(100).max(3000) }),
  mistakesMd: z.string().min(100).max(3000),
  check: z.object({ code: program(20), output: z.string().min(1).max(300), explanationMd: z.string().min(40).max(1500) }),
});
export type LessonDraft = z.infer<typeof lessonDraft>;

// Gemini wants the schema itself, without the dialect tag.
const jsonSchemaOf = (type: z.ZodType) => {
  const { $schema, ...schema } = z.toJSONSchema(type);
  return schema;
};
export const lessonJsonSchema = jsonSchemaOf(lessonDraft);

export type LessonContext = {
  skill: { name: string; description: string | null };
  known: string[]; // every skill below this one, across courses: may be used, not re-taught
  level: Level;
  exerciseTitles: string[]; // the skill's practice exercises, which the lesson must not solve
  previousFailure?: string; // why the last try was rejected, so this one can fix it
};

export const LESSON_SYSTEM = `You write one lesson of an adaptive programming course, as JSON matching the schema. The learner reads it just before practising.
Programs are C++20, compiled with clang 19 (-std=c++20 -O2) and run: every output you state is checked by running the program, so it must be exactly right.
Write plain, friendly English with short sentences. Markdown only, no HTML. Never mention any website, video creator, book or course provider, and never address the learner by name.`;

// The fact-check before a lesson is frozen (ADR-0010: reviewed, then frozen). Claim by claim: asked only
// for errors in general, Flash passed a lesson saying an inner loop's `int i` changes the outer `i`.
export const REVIEW_SYSTEM = `You fact-check one lesson of a C++ course before learners see it. Go through its technical claims one by one, including those in the common-mistakes list, and test each against the C++20 standard: what would actually happen if a learner wrote that code? Report a claim only if it is false or would mislead a learner about how C++ behaves. Ignore style, tone and anything left out. "problems" is empty when every claim holds.`;
export const lessonReview = z.object({ problems: z.array(z.object({ claim: z.string(), truth: z.string() })) });
export const reviewJsonSchema = jsonSchemaOf(lessonReview);
export const reviewPrompt = (skillName: string, level: Level, draft: LessonDraft) => `SKILL: ${skillName}. LEVEL: ${level}.

LESSON:
${JSON.stringify(draft, null, 1)}`;

export function lessonPrompt(c: LessonContext) {
  const parts = [
    `SKILL: ${c.skill.name}${c.skill.description ? `: ${c.skill.description}` : ""}`,
    `ALREADY KNOWN (use freely, don't re-teach): ${c.known.length ? c.known.join(", ") : "nothing yet: this is the learner's first skill"}.`,
    `LEVEL: ${c.level}. ${FOR_LEVEL[c.level]}`,
    `WRITE:
- explanationMd: 300–700 words. Subheadings with ### at most.
- diagram: Mermaid source for one diagram of the core idea (flowchart TB, or sequenceDiagram or stateDiagram-v2 if it fits better), at most 12 nodes, labels in double quotes, no styling.
- example.code: a complete program with its #includes and main(), at most 40 lines, showing the idea in use. example.output: exactly what it prints. example.walkthroughMd: what happens, step by step.
- mistakesMd: 3–5 Markdown bullets, each a common mistake with this skill, why it happens and how to avoid it.
- check.code: a different, complete program of at most 15 lines whose output the learner predicts. check.output: exactly what it prints. check.explanationMd: why that is the output.
- Every program is deterministic: no addresses, sizeof, randomness, unordered container order or inexact floating-point output.`,
    c.exerciseTitles.length ? `Don't solve or reuse these practice exercises of the skill: ${c.exerciseTitles.join("; ")}.` : "",
    c.previousFailure ? `Your previous lesson was rejected: ${c.previousFailure}. Fix that.` : "",
  ];
  return parts.filter(Boolean).join("\n\n");
}
