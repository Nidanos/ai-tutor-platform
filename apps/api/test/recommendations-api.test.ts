import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  enrollments,
  exerciseAttempts,
  exercises,
  masteryRecords,
  recommendations,
  skillPrerequisites,
} from "../src/infrastructure/database/schema/index.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

// A course of two skills (second needs first). Only the first has content: rungs 1 and 2.
async function courseWithLearner() {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const [first, second] = [await createSkill(course.id), await createSkill(course.id)];
  await db.insert(skillPrerequisites).values({ skillId: second.id, prerequisiteId: first.id });
  const [rung1, rung2] = await db
    .insert(exercises)
    .values([1, 2].map((rung) => ({ ...exerciseRow(first.id, rung), status: "verified" as const })))
    .returning();
  const user = await createUser();
  const next = async (status = 200) =>
    (await request(app).get(`/api/v1/recommendations/next?course=${course.slug}`).set("Authorization", await bearerFor(user.id)).expect(status)).body;
  const masteryOf = (skillId: string, values: Partial<typeof masteryRecords.$inferInsert>) =>
    db.insert(masteryRecords).values({ userId: user.id, skillId, languageCode: "cpp", decayLambda: 0.05, ...values });
  return { user, first, second, rung1, rung2, next, masteryOf };
}

const CLEARED = { writingScore: 0.72, writingEvidenceAt: new Date(), clearedAt: new Date(), attemptCount: 5 };

describe("GET /recommendations/next", () => {
  it("starts a new learner on the first skill at rung 1, enrolls them, and saves the reasons", async () => {
    const { user, first, rung1, next } = await courseWithLearner();
    const { recommendation } = (await next()).data;
    expect(recommendation).toMatchObject({ skill: { id: first.id }, rung: 1, reason: "new_skill", exerciseId: rung1.id });

    const [row] = await db.select().from(recommendations).where(eq(recommendations.id, recommendation.id));
    expect(row).toMatchObject({ algorithmVersion: "m5-v1", exerciseId: rung1.id });
    expect(await db.select().from(enrollments).where(eq(enrollments.userId, user.id))).toHaveLength(1);
  });

  it("moves to rung 2 after the rung-1 exercise is solved", async () => {
    const { user, first, rung1, rung2, next, masteryOf } = await courseWithLearner();
    await next(); // the first call enrolls the learner
    const [enrolled] = await db.select().from(enrollments).where(eq(enrollments.userId, user.id));
    await db.insert(exerciseAttempts).values({ userId: user.id, enrollmentId: enrolled.id, exerciseId: rung1.id, hintCeiling: 5, status: "solved" });
    await masteryOf(first.id, { readingScore: 0.08, readingEvidenceAt: new Date(), attemptCount: 1 });
    expect((await next()).data.recommendation).toMatchObject({ rung: 2, exerciseId: rung2.id });
  });

  it("names the next skill without an exercise when it has no content yet", async () => {
    const { first, second, next, masteryOf } = await courseWithLearner();
    await masteryOf(first.id, CLEARED);
    expect((await next()).data.recommendation).toMatchObject({ skill: { id: second.id }, exerciseId: null });
  });

  it("returns null when every skill is cleared and fresh, and 404 for an unknown course", async () => {
    const { first, second, next, masteryOf } = await courseWithLearner();
    await masteryOf(first.id, CLEARED);
    await masteryOf(second.id, CLEARED);
    expect((await next()).data.recommendation).toBeNull();

    const user = await createUser();
    const res = await request(app).get("/api/v1/recommendations/next?course=no-such-course").set("Authorization", await bearerFor(user.id)).expect(404);
    expect(res.body.error.code).toBe("COURSE_NOT_FOUND");
  });
});

