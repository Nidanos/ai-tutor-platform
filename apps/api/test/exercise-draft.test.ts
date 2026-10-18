import { describe, expect, it } from "vitest";
import { harnessFor } from "../src/infrastructure/database/seed/seed-exercises.js";
import { generationPrompt, jsonSchemaFor, TASK, toTemplate, writingDraft } from "../src/modules/m6_exercises/services/exercise-draft.js";

const draft = {
  title: "Twice",
  promptMd: "Return twice `n`.",
  functionSignature: "int twice(int n)",
  call: 'std::cout << twice({{args}}) << "\\n";',
  starterCode: "int twice(int n) { return 0; }",
  reference: "int twice(int n) { return 2 * n; }",
  cases: [{ args: "2", expected: "4" }, { args: "0", expected: "0" }, { args: "-3", expected: "-6" }],
  wrongSolutions: ["int twice(int n) { return n; }", "int twice(int n) { return n + 2; }", "int twice(int n) { return n * n; }"],
};

describe("exercise drafts", () => {
  it("become templates the bank's harness can run, with the standard closing instruction", () => {
    const template = toTemplate(draft, 5, "functions");
    expect(template).toMatchObject({ skill: "functions", rung: 5, functionSignature: "int twice(int n)", cases: draft.cases });
    expect(template.promptMd.endsWith(TASK)).toBe(true);
    expect(harnessFor(template)).toContain('case 3: std::cout << twice(-3) << "\\n"; break;');
  });

  it("turn a predict draft into a rung-1 template whose program is its own reference", () => {
    const template = toTemplate({ title: "Integer division", program: "int main() {}", expectedOutput: "3" }, 1, "operators");
    expect(template).toMatchObject({ rung: 1, title: "What does it print? Integer division", starterCode: "int main() {}", reference: "int main() {}" });
    expect(harnessFor(template)).toBeNull();
  });

  it("refuse a call statement that doesn't take the test's arguments", () => {
    expect(writingDraft.safeParse({ ...draft, call: "std::cout << twice(2);" }).success).toBe(false);
    expect(writingDraft.safeParse({ ...draft, wrongSolutions: ["only one"] }).success).toBe(false);
  });

  it("prompt with the skill, what it may use, the existing titles and the last failure", () => {
    const prompt = generationPrompt({
      skill: { slug: "loops", name: "Loops", description: "Repeating work." },
      prerequisites: ["Operators", "Making decisions"],
      rung: 3,
      existingTitles: ["Count the digits"],
      previousFailure: "wrong solution 2 passes every test",
    });
    expect(prompt).toContain("SKILL: Loops: Repeating work.");
    expect(prompt).toContain("USE ONLY this skill and: Operators, Making decisions.");
    expect(prompt).toContain("RUNG 3. COMPLETE");
    expect(prompt).toContain("Count the digits");
    expect(prompt).toContain("Your previous draft was rejected: wrong solution 2 passes every test.");
  });

  it("give Gemini a schema without the dialect tag", () => {
    expect(jsonSchemaFor(4)).not.toHaveProperty("$schema");
    expect(jsonSchemaFor(1)).toMatchObject({ type: "object", required: ["title", "program", "expectedOutput"] });
  });
});
