import { describe, expect, it } from "vitest";
import { checkHint, leaksSolution } from "../src/modules/m8_socratic/services/solution-filter.js";

const starter = `#include <iostream>

int digitSum(int n) {
    return 0;
}
`;
const reference = `#include <iostream>

int digitSum(int n) {
    int sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}
`;
const context = { reference, starter };

describe("solution filter", () => {
  it("passes a hint in words, and a small fragment of a different idea", () => {
    expect(checkHint("Think about how to get the **last digit** of a number. Which operator gives a remainder?", context).passed).toBe(true);
    expect(checkHint("You can repeat while a condition holds:\n```cpp\nwhile (x > 0) {\n}\n```", context).passed).toBe(true);
  });

  it("blocks the solution, whole or in its key lines, fenced or not", () => {
    expect(checkHint(`Here you go:\n\`\`\`cpp\n${reference}\`\`\``, context)).toMatchObject({ passed: false });
    expect(checkHint("Write: while (n > 0) { sum += n % 10; n /= 10; } and return sum", context).passed).toBe(false);
  });

  it("doesn't count code the learner already has", () => {
    const learnerCode = reference.replace("return sum;", "return n;"); // nearly there
    const quote = "In your loop `while (n > 0) { sum += n % 10; n /= 10; }` you then return the wrong variable.";
    expect(checkHint(quote, { ...context, learnerCode }).passed).toBe(true);
  });

  it("blocks more than a fragment of code, even unrelated code", () => {
    const program = Array.from({ length: 8 }, (_, i) => `int a${i} = ${i};`).join("\n");
    expect(checkHint(`\`\`\`cpp\n${program}\n\`\`\``, context)).toMatchObject({ passed: false, longestCode: 8 });
  });

  it("lets a lesson teach a one-line fix's idiom, but not repeat a larger answer (ADR-0019)", () => {
    // A one-line fix: only `i -= i & -i` is the answer's own code. A lesson that teaches the idea must show it.
    const fix = { starter: "int sum(int i) { int s = 0; for (; i > 0; i--) s += t[i]; return s; }", reference: "int sum(int i) { int s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; }" };
    expect(checkHint("Step down with `for (; i > 0; i -= i & -i)`.", fix).passed).toBe(false); // a live hint still may not
    expect(leaksSolution("The walk: `for (; i > 0; i -= i & -i) s += t[i];`", fix)).toBe(false);
    expect(leaksSolution(`An example:
\`\`\`cpp
${reference}\`\`\``, context)).toBe(true); // the whole digit-sum answer
  });

  it("blocks a predict-the-output hint that gives the output away", () => {
    const rung1 = { reference: "int main() {}", starter: "int main() {}", output: "ReadyGo!\nA" };
    expect(checkHint("It prints ReadyGo! then A on the next line.", rung1).passed).toBe(true); // words, not the exact output
    expect(checkHint("The output is:\n```\nReadyGo!\nA\n```", rung1)).toMatchObject({ passed: false, givesOutput: true });
  });
});
