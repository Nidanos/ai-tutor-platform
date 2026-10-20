import { describe, expect, it } from "vitest";
import { lessonDraft, lessonPrompt, levelFor } from "../src/modules/m6_exercises/services/lesson-draft.js";

const PROGRAM = "#include <iostream>\nint main() {\n    std::cout << 6 << \"\\n\";\n}\n";
const valid = {
  explanationMd: "x".repeat(400),
  diagram: 'flowchart TB\n  A["Start"] --> B["Done"]',
  example: { code: PROGRAM, output: "6", walkthroughMd: "y".repeat(100) },
  mistakesMd: "z".repeat(100),
  check: { code: PROGRAM, output: "6", explanationMd: "w".repeat(40) },
};

describe("lesson level", () => {
  it("is new before any evidence, building with some, and strong once the skill is written well or cleared", () => {
    expect(levelFor({ reading: 0, writing: 0, cleared: false })).toBe("new");
    expect(levelFor({ reading: 0.85, writing: 0, cleared: false })).toBe("building"); // placed for reading only
    expect(levelFor({ reading: 0, writing: 0.69, cleared: false })).toBe("building");
    expect(levelFor({ reading: 0, writing: 0.7, cleared: false })).toBe("strong");
    expect(levelFor({ reading: 0, writing: 0.4, cleared: true })).toBe("strong"); // cleared, then faded
  });
});

describe("lesson draft", () => {
  it("accepts a complete lesson, and refuses a diagram the web can't draw or a program without main", () => {
    expect(lessonDraft.safeParse(valid).success).toBe(true);
    expect(lessonDraft.safeParse({ ...valid, diagram: "A --> B" }).success).toBe(false);
    expect(lessonDraft.safeParse({ ...valid, diagram: '%%{init: {"theme":"dark"}}%%\nflowchart TB\n  A --> B' }).success).toBe(false);
    expect(lessonDraft.safeParse({ ...valid, check: { ...valid.check, code: "std::cout << 6; // no main, but long enough" } }).success).toBe(false);
  });

  it("asks for the learner's level, builds on what they know, and avoids the skill's exercises", () => {
    const prompt = lessonPrompt({
      skill: { name: "Linked lists", description: "Nodes joined by pointers." },
      known: ["Pointers", "Complexity analysis"],
      level: "building",
      exerciseTitles: ["Reverse a list"],
      previousFailure: "the check program doesn't compile",
    });
    expect(prompt).toContain("SKILL: Linked lists: Nodes joined by pointers.");
    expect(prompt).toContain("ALREADY KNOWN (use freely, don't re-teach): Pointers, Complexity analysis.");
    expect(prompt).toContain("LEVEL: building. The learner knows the idea but still makes mistakes");
    expect(prompt).toContain("Don't solve or reuse these practice exercises of the skill: Reverse a list.");
    expect(prompt).toContain("rejected: the check program doesn't compile. Fix that.");
  });
});
