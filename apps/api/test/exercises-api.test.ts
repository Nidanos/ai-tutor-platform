import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  enrollments,
  exerciseAttempts,
  exercises,
  exerciseSecrets,
  exerciseTests,
  skillScaffolding,
} from "../src/infrastructure/database/schema/index.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

// A verified practice exercise with a secret harness, one sample test and one hidden test.
async function verifiedExercise(status: "verified" | "draft" = "verified") {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const skill = await createSkill(course.id);
  const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id), status }).returning();
  await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "SECRET-HARNESS", referenceSolution: "SECRET-REF" });
  await db.insert(exerciseTests).values([
    { exerciseId: exercise.id, seq: 1, name: "Example", size: "small", visibility: "sample", input: "2 3", expectedOutput: "5" },
    { exerciseId: exercise.id, seq: 2, name: "Hidden", size: "small", visibility: "hidden", input: "HIDDEN-IN", expectedOutput: "HIDDEN-OUT" },
  ]);
  return exercise;
}

// Resolves to the response once the status matched.
const open = async (exerciseId: string, userId: string, status = 200) =>
  request(app).get(`/api/v1/exercises/${exerciseId}`).set("Authorization", await bearerFor(userId)).expect(status);

describe("GET /exercises/:id", () => {
  it("shows the exercise and its sample test, never secrets or hidden tests", async () => {
    const [exercise, user] = [await verifiedExercise(), await createUser()];
    const res = await open(exercise.id, user.id);
    expect(res.body.data.exercise).toMatchObject({ title: "Test", rung: 3, sampleTests: [{ seq: 1, input: "2 3", expectedOutput: "5" }] });
    expect(JSON.stringify(res.body)).not.toMatch(/SECRET|HIDDEN/);
  });

  it("starts one attempt, enrolling the learner and starting the skill at fade stage 1", async () => {
    const [exercise, user] = [await verifiedExercise(), await createUser()];
    const first = (await open(exercise.id, user.id)).body.data.attempt;
    const again = (await open(exercise.id, user.id)).body.data.attempt;
    expect(first).toMatchObject({ status: "active", hintLevel: 0, hintCeiling: 5, submissionCount: 0 });
    expect(again.id).toBe(first.id);

    const attempts = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, user.id));
    expect(attempts).toHaveLength(1);
    expect(await db.select().from(enrollments).where(eq(enrollments.userId, user.id))).toHaveLength(1);
    const [stage] = await db.select().from(skillScaffolding).where(eq(skillScaffolding.userId, user.id));
    expect(stage.currentStage).toBe(1);
  });

  it("returns a solved attempt as solved instead of starting a new one", async () => {
    const [exercise, user] = [await verifiedExercise(), await createUser()];
    const { attempt } = (await open(exercise.id, user.id)).body.data;
    await db.update(exerciseAttempts).set({ status: "solved" }).where(eq(exerciseAttempts.id, attempt.id));
    expect((await open(exercise.id, user.id)).body.data.attempt).toMatchObject({ id: attempt.id, status: "solved" });
  });

  it("hides exercises that aren't verified", async () => {
    const [draft, user] = [await verifiedExercise("draft"), await createUser()];
    const res = await open(draft.id, user.id, 404);
    expect(res.body.error.code).toBe("EXERCISE_NOT_FOUND");
  });

  it("never shows a predict-the-output exercise's answer", async () => {
    const [exercise, user] = [await verifiedExercise(), await createUser()];
    await db.update(exercises).set({ rung: 1 }).where(eq(exercises.id, exercise.id));
    const res = await open(exercise.id, user.id);
    expect(res.body.data.exercise.sampleTests).toEqual([]);
  });

  it("never opens a placement-test exercise as practice", async () => {
    const [exercise, user] = [await verifiedExercise(), await createUser()];
    await db.update(exercises).set({ purpose: "diagnostic" }).where(eq(exercises.id, exercise.id));
    await open(exercise.id, user.id, 404);
  });
});
