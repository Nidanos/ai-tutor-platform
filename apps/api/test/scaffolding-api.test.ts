import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  exerciseAttempts,
  exercises,
  exerciseSecrets,
  exerciseTests,
  fadeStageChanges,
  skillScaffolding,
} from "../src/infrastructure/database/schema/index.js";
import type { SandboxProvider } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { getStage } from "../src/modules/m12_scaffolding/services/scaffolding.service.js";
import { openAttempt } from "../src/modules/m7_execution/services/attempts.service.js";
import { runSubmission } from "../src/modules/m7_execution/services/run-submission.js";
import { submit } from "../src/modules/m7_execution/services/submissions.service.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

vi.mock("../src/infrastructure/queue/submissions-queue.js", () => ({ enqueueSubmission: vi.fn() }));

const passingSandbox: SandboxProvider = {
  run: async () => ({
    sandboxId: "fake",
    compile: { ok: true, output: "" },
    tests: [{ exitCode: 0, timedOut: false, timeMs: 1, peakMemoryKb: 1, stdout: "6", stderr: "" }],
  }),
};

// A new learner on a new skill (default 4-stage schedule), optionally already at a later stage.
async function learnerOnSkill(startStage = 1) {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const [skill, user] = [await createSkill(course.id), await createUser()];
  const key = { userId: user.id, skillId: skill.id, languageCode: "cpp" };
  await getStage(key, course.id);
  await db.update(skillScaffolding).set({ currentStage: startStage }).where(eq(skillScaffolding.userId, user.id));

  // Solves a fresh exercise of this rung with this many hints; returns the skill's stage after.
  const solve = async (rung: number, hints: number) => {
    const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id, rung), status: "verified" }).returning();
    await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "h", referenceSolution: "r" });
    await db.insert(exerciseTests).values({ exerciseId: exercise.id, seq: 1, name: "t", size: "small", visibility: "sample", expectedOutput: "6" });
    const attempt = await openAttempt(user.id, exercise);
    await db.update(exerciseAttempts).set({ hintLevel: hints }).where(eq(exerciseAttempts.id, attempt.id));
    const { submissionId } = await submit(user.id, { attemptId: attempt.id, answer: "code", idempotencyKey: randomUUID() });
    await runSubmission(submissionId, false, passingSandbox);
    const [row] = await db.select().from(skillScaffolding).where(eq(skillScaffolding.userId, user.id));
    return { stage: row.currentStage, submissionId };
  };
  return { user, skill, solve };
}

describe("scaffolding fade", () => {
  it("moves a skill on when the stage's rung is solved with at most 1 hint, and logs why", async () => {
    const { user, solve } = await learnerOnSkill();
    const { stage, submissionId } = await solve(2, 1);
    expect(stage).toBe(2);
    const [move] = await db
      .select()
      .from(fadeStageChanges)
      .where(and(eq(fadeStageChanges.userId, user.id), eq(fadeStageChanges.toStage, 2)));
    expect(move).toMatchObject({ fromStage: 1, submissionId, reason: "solved" });
  });

  it("stays put with too many hints or on an easier rung, and moves one stage at a time", async () => {
    const { solve } = await learnerOnSkill();
    expect((await solve(2, 2)).stage).toBe(1); // 2 hints: still needs the help
    expect((await solve(1, 0)).stage).toBe(1); // rung 1 is easier than this stage asks
    expect((await solve(5, 0)).stage).toBe(2); // harder counts, but only one step
  });

  it("never moves past the last stage", async () => {
    const { solve } = await learnerOnSkill(4);
    expect((await solve(5, 0)).stage).toBe(4);
  });

  it("shows each skill's stage and limits", async () => {
    const { user, skill, solve } = await learnerOnSkill();
    await solve(2, 0);
    const res = await request(app).get("/api/v1/scaffolding/state").set("Authorization", await bearerFor(user.id)).expect(200);
    expect(res.body.data.skills).toEqual([
      {
        skill: { id: skill.id, slug: skill.slug, name: "Test" },
        languageCode: "cpp",
        stage: 2,
        totalStages: 4,
        minRung: 3,
        maxHintLevel: 4,
        advanceRung: 3,
        advanceMaxHints: 1,
        description: "Complete code",
        stageEnteredAt: expect.any(String),
      },
    ]);
  });
});
