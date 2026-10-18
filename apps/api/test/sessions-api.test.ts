import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  enrollments,
  exerciseAttempts,
  exercises,
  learningSessions,
  masteryRecords,
  sessionSteps,
  skillPrerequisites,
} from "../src/infrastructure/database/schema/index.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

const MINUTE = 60_000;

// A course of two skills (second needs first); the first has verified exercises at rungs 1 and 2.
async function learnerInCourse() {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const [first, second] = [await createSkill(course.id), await createSkill(course.id)];
  await db.insert(skillPrerequisites).values({ skillId: second.id, prerequisiteId: first.id });
  const [rung1, rung2] = await db
    .insert(exercises)
    .values([1, 2].map((rung) => ({ ...exerciseRow(first.id, rung), status: "verified" as const })))
    .returning();
  const user = await createUser();
  const auth = await bearerFor(user.id);
  const call = async (method: "get" | "post" | "patch", path: string, body: object = {}, status = 200) =>
    (await request(app)[method](`/api/v1/sessions${path}`).set("Authorization", auth).send(body).expect(status)).body;
  const start = async () => (await call("post", "", { course: course.slug })).data.session;
  const active = async () => (await call("get", "/active")).data.session;
  const setStatus = async (id: string, status: string, code = 200) => (await call("patch", `/${id}`, { status }, code));
  const backdate = (values: Partial<typeof learningSessions.$inferInsert>) => db.update(learningSessions).set(values).where(eq(learningSessions.userId, user.id));
  return { course, first, second, rung1, rung2, user, call, start, active, setStatus, backdate };
}

describe("POST /sessions", () => {
  it("starts a session on the recommender's first step, and resumes it on the next call", async () => {
    const t = await learnerInCourse();
    expect(await t.active()).toBeNull();
    const session = await t.start();
    expect(session).toMatchObject({ status: "active", step: { seq: 1, kind: "exercise", skill: { id: t.first.id }, rung: 1, exerciseId: t.rung1.id } });
    expect((await t.start()).id).toBe(session.id);
    expect(await t.active()).toMatchObject({ id: session.id, step: { id: session.step.id } });
  });

  it("ends as completed when the course is done, and 404s for an unknown course", async () => {
    const t = await learnerInCourse();
    for (const skill of [t.first, t.second])
      await db.insert(masteryRecords).values({ userId: t.user.id, skillId: skill.id, languageCode: "cpp", decayLambda: 0.05, writingScore: 0.9, writingEvidenceAt: new Date(), clearedAt: new Date() });
    expect(await t.start()).toMatchObject({ status: "ended", endReason: "completed", step: null });
    await t.call("post", "", { course: "no-such-course" }, 404);
  });
});

describe("GET /sessions/active", () => {
  it("moves to the next step once the current exercise is solved", async () => {
    const t = await learnerInCourse();
    const session = await t.start();
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.userId, t.user.id));
    await db.insert(exerciseAttempts).values({ userId: t.user.id, enrollmentId: enrollment.id, exerciseId: t.rung1.id, hintCeiling: 5, status: "solved" });
    await db.insert(masteryRecords).values({ userId: t.user.id, skillId: t.first.id, languageCode: "cpp", decayLambda: 0.05, readingScore: 0.08, readingEvidenceAt: new Date(), attemptCount: 1 });

    expect(await t.active()).toMatchObject({ id: session.id, step: { seq: 2, rung: 2, exerciseId: t.rung2.id } });
    const [firstStep] = await db.select().from(sessionSteps).where(eq(sessionSteps.id, session.step.id));
    expect(firstStep.status).toBe("completed");
  });

  it("pauses a session idle for 15 minutes without counting the gap, and ends one paused for a day", async () => {
    const t = await learnerInCourse();
    await t.start();
    await t.backdate({ lastActiveAt: new Date(Date.now() - 20 * MINUTE), activeMs: 5 * MINUTE });
    expect(await t.active()).toMatchObject({ status: "paused", activeMs: 5 * MINUTE });

    await t.backdate({ pausedAt: new Date(Date.now() - 25 * 60 * MINUTE) });
    expect(await t.active()).toBeNull();
    const [ended] = await db.select().from(learningSessions).where(eq(learningSessions.userId, t.user.id));
    expect(ended).toMatchObject({ status: "ended", endReason: "idle" });
  });
});

describe("PATCH /sessions/:id", () => {
  it("pauses, resumes at the same step, and ends for good", async () => {
    const t = await learnerInCourse();
    const session = await t.start();
    expect((await t.setStatus(session.id, "paused")).data.session.status).toBe("paused");
    expect((await t.setStatus(session.id, "active")).data.session).toMatchObject({ status: "active", step: { id: session.step.id } });
    expect((await t.setStatus(session.id, "ended")).data.session).toMatchObject({ status: "ended", endReason: "user" });

    expect((await t.setStatus(session.id, "active", 409)).error.code).toBe("SESSION_ENDED");
    expect(await t.active()).toBeNull();
    expect((await t.start()).id).not.toBe(session.id); // a fresh session
  });

  it("hides other learners' sessions and rejects unknown states", async () => {
    const t = await learnerInCourse();
    const session = await t.start();
    await t.setStatus(session.id, "finished", 400);
    const stranger = await bearerFor((await createUser()).id);
    await request(app).patch(`/api/v1/sessions/${session.id}`).set("Authorization", stranger).send({ status: "paused" }).expect(404);
  });
});
