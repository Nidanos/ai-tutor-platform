import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { generationFailures, generationJobs } from "../src/infrastructure/database/schema/index.js";
import type { LlmProvider } from "../src/infrastructure/llm/llm-provider.js";
import type { SandboxProvider } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { runGeneration } from "../src/modules/m6_exercises/services/generate-exercise.js";
import { createCourse, createSkill } from "./helpers.js";

// Its own file: here this month's generation budget is already spent.
vi.mock("../src/infrastructure/llm/llm-log.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/infrastructure/llm/llm-log.js")>()),
  spentThisMonthInr: async (purpose: string) => (purpose === "exercise_generation" ? 300 : 0),
}));

describe("generation budget", () => {
  it("stops before calling the model once ₹300 is spent this month, and falls back", async () => {
    const skill = await createSkill((await createCourse()).id);
    const [job] = await db
      .insert(generationJobs)
      .values({ skillId: skill.id, languageCode: "cpp", rung: 2, variantSeed: 1000, trigger: "on_demand", model: "gemini-3.8-flash", promptVersion: "test" })
      .returning();
    const llm: LlmProvider = { generate: vi.fn() };
    const sandbox: SandboxProvider = { run: vi.fn() };

    expect(await runGeneration(job.id, llm, sandbox)).toBeUndefined();
    expect(llm.generate).not.toHaveBeenCalled();
    const [row] = await db.select().from(generationJobs).where(eq(generationJobs.id, job.id));
    expect(row).toMatchObject({ status: "fell_back", fallbackExerciseId: null });
    const [failure] = await db.select().from(generationFailures).where(eq(generationFailures.generationJobId, job.id));
    expect(failure).toMatchObject({ stage: "llm", details: { reason: "this month's generation budget is spent" } });
  });
});
