import { readdirSync, readFileSync } from "node:fs";
import { LEVELS, type LessonDraft, type Level } from "../../../modules/m6_exercises/services/lesson-draft.js";

export type LessonSeed = LessonDraft & { skill: string; level: Level };

// The hand-written lessons (ADR-0019): one folder per course, one Markdown file per skill, named by its
// slug, with "# new", "# building" and "# strong", each holding "## explanation", "## diagram" (a ```mermaid
// block), "## example", "## mistakes" and "## check". In example and check, the first ```cpp block is the
// program, the first ```text block what it prints, and the rest is the walkthrough.
const sections = (text: string, depth: number) =>
  new Map(
    text
      .split(new RegExp(`^${"#".repeat(depth)} `, "m"))
      .slice(1)
      .map((part) => [part.slice(0, part.indexOf("\n")).trim(), part.slice(part.indexOf("\n")).trim()]),
  );

const block = (section: string, lang: string) => section.match(new RegExp("```" + lang + "\\n([\\s\\S]*?)\\n```"));

function program(section: string) {
  const code = block(section, "cpp")!;
  const output = block(section, "text")!;
  return { code: `${code[1]}\n`, output: output[1], prose: section.replace(code[0], "").replace(output[0], "").trim() };
}

function lesson(skill: string, level: Level, text: string): LessonSeed {
  const part = sections(text, 2);
  const example = program(part.get("example")!);
  const check = program(part.get("check")!);
  return {
    skill,
    level,
    explanationMd: part.get("explanation")!,
    diagram: block(part.get("diagram")!, "mermaid")![1],
    example: { code: example.code, output: example.output, walkthroughMd: example.prose },
    mistakesMd: part.get("mistakes")!,
    check: { code: check.code, output: check.output, explanationMd: check.prose },
  };
}

function lessonsIn(folder: string): LessonSeed[] {
  const dir = new URL(`./${folder}/`, import.meta.url);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .flatMap((file) => {
      const levels = sections(readFileSync(new URL(file, dir), "utf8").replace(/\r\n/g, "\n"), 1);
      return LEVELS.filter((level) => levels.has(level)).map((level) => lesson(file.replace(/\.md$/, ""), level, levels.get(level)!));
    });
}

export const courseLessons: Record<string, LessonSeed[]> = {
  "cpp-basics": lessonsIn("cpp-lessons"),
  dsa: lessonsIn("dsa-lessons"),
};
