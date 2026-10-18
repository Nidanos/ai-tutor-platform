import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { exerciseHints, exercises, exerciseSecrets, exerciseTests } from "../src/infrastructure/database/schema/index.js";
import type { LlmProvider } from "../src/infrastructure/llm/llm-provider.js";
import { freezeHints } from "../src/modules/m8_socratic/services/freeze-hints.js";
import { createCourse, createSkill, exerciseRow } from "./helpers.js";

const REFERENCE = "int twice(int n) {\n    int doubled = n * 2;\n    return doubled;\n}\n";

async function practiceExercise() {
  const skill = await createSkill((await createCourse()).id);
  const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id), status: "verified", starterCode: "int twice(int n) {\n    return 0;\n}\n" }).returning();
  await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "h", referenceSolution: REFERENCE });
  await db.insert(exerciseTests).values({ exerciseId: exercise.id, seq: 1, name: "Example", size: "small", visibility: "sample", expectedOutput: "4" });
  return exercise;
}

// A fake Gemini that answers with these four hints, in order of calls.
const fake = (...replies: string[][]): LlmProvider => {
  const generate = vi.fn();
  replies.forEach(([l1, l2, l3, l4]) => generate.mockResolvedValueOnce({ text: JSON.stringify({ level1: l1, level2: l2, level3: l3, level4: l4 }), callId: 0 }));
  return { generate };
};
const SAFE = ["Multiplication.", "The return line.", "Return the input times two.", "Tripling: `return x * 3;`"];
const stored = async (exerciseId: string) => (await db.select().from(exerciseHints).where(eq(exerciseHints.exerciseId, exerciseId))).map((h) => h.level).sort();

describe("frozen hints", () => {
  it("stores levels 1–4 once, and leaves an exercise that already has hints alone", async () => {
    const exercise = await practiceExercise();
    expect(await freezeHints(exercise.id, fake(SAFE))).toEqual({ status: "frozen" });
    expect(await stored(exercise.id)).toEqual([1, 2, 3, 4]);
    expect(await freezeHints(exercise.id, fake(SAFE))).toEqual({ status: "already" });
  });

  it("asks again when a hint gives the solution away, and skips the exercise if it happens twice", async () => {
    const leaky = [...SAFE.slice(0, 3), `\`\`\`cpp\n${REFERENCE}\`\`\``];
    const retried = await practiceExercise();
    expect(await freezeHints(retried.id, fake(leaky, SAFE))).toEqual({ status: "frozen" });

    const skipped = await practiceExercise();
    expect(await freezeHints(skipped.id, fake(leaky, leaky))).toEqual({ status: "skipped", reason: "level 4 gave too much away" });
    expect(await stored(skipped.id)).toEqual([]);
  });
});
