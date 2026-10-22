import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  calibrationRecords,
  consents,
  enrollments,
  exerciseAttempts,
  exercises,
  generationFailures,
  generationJobs,
  hintEvents,
  learningSessions,
  masteryRecords,
  submissions,
  users,
} from "../src/infrastructure/database/schema/index.js";
import { bearerFor, createAttempt, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

async function admin() {
  const user = await createUser();
  await db.update(users).set({ role: "ADMIN" }).where(eq(users.id, user.id));
  return bearerFor(user.id);
}

const overviewFor = async (auth: string, query = "", status = 200) =>
  (await request(app).get(`/api/v1/analytics/overview${query}`).set("Authorization", auth).expect(status)).body;

describe("GET /analytics/overview", () => {
  it("is for admins only", async () => {
    const learner = await bearerFor((await createUser()).id);
    expect((await overviewFor(learner, "", 403)).error.code).toBe("FORBIDDEN");
    await request(app).get("/api/v1/analytics/overview").expect(401);
  });

  it("counts new learners, opt-ins, code runs, sessions and clears in the window", async () => {
    const auth = await admin();
    const course = await createCourse();
    const inCourse = `?course=${course.slug}`;
    const before = (await overviewFor(auth, inCourse)).data;

    // One new learner who opted into the study, ran code twice (AC, then SE), and studied for 10 minutes.
    const skill = await createSkill(course.id);
    const learner = await createUser();
    await db.insert(consents).values({ userId: learner.id, kind: "research_study", policyVersion: "0.1" });
    const [enrollment] = await db.insert(enrollments).values({ userId: learner.id, courseId: course.id, languageCode: "cpp" }).returning();
    const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id), status: "verified" }).returning();
    const [attempt] = await db.insert(exerciseAttempts).values({ userId: learner.id, enrollmentId: enrollment.id, exerciseId: exercise.id, hintCeiling: 5 }).returning();
    const submission = (verdict: "AC" | "SE") => ({
      attemptId: attempt.id, userId: learner.id, exerciseId: exercise.id, languageCode: "cpp", answer: "x", answerSha256: "x",
      idempotencyKey: randomUUID(), status: "completed" as const, verdict,
    });
    await db.insert(submissions).values([submission("AC"), submission("SE")]);
    await db.insert(learningSessions).values({ userId: learner.id, enrollmentId: enrollment.id, activeMs: 10 * 60_000, status: "ended" });
    await db.insert(masteryRecords).values({ userId: learner.id, skillId: skill.id, languageCode: "cpp", decayLambda: 0.05, clearedAt: new Date() });
    await db.insert(hintEvents).values([{ attemptId: attempt.id, level: 1, kind: "delivered" }, { attemptId: attempt.id, level: 5, kind: "bottomed_out" }]);
    const [gaveUp] = await db
      .insert(generationJobs)
      .values({ skillId: skill.id, languageCode: "cpp", rung: 2, variantSeed: 1000, trigger: "on_demand", status: "fell_back", model: "m", promptVersion: "p" })
      .returning();
    await db.insert(generationFailures).values({ generationJobId: gaveUp.id, tryNo: 1, stage: "schema" });

    const after = (await overviewFor(auth, inCourse)).data;
    expect(after.window.days).toBe(30);
    expect(after.learners.total - before.learners.total).toBeGreaterThanOrEqual(1);
    expect(after.learners.consented.researchStudy - before.learners.consented.researchStudy).toBeGreaterThanOrEqual(1);
    expect(after.runs.submissions - before.runs.submissions).toBeGreaterThanOrEqual(2);
    expect((after.runs.byVerdict.SE ?? 0) - (before.runs.byVerdict.SE ?? 0)).toBeGreaterThanOrEqual(1);
    expect(after.runs.sandboxErrorRate).toBeGreaterThan(0);
    expect(after.study.studyMinutes - before.study.studyMinutes).toBeGreaterThanOrEqual(10);
    expect(after.outcomes.skillsCleared - before.outcomes.skillsCleared).toBeGreaterThanOrEqual(1);
    expect(after.hints.delivered - before.hints.delivered).toBeGreaterThanOrEqual(1);
    expect(after.hints.bottomedOut - before.hints.bottomedOut).toBeGreaterThanOrEqual(1);
    expect(after.ai).toMatchObject({ monthlyBudgetInr: { hints: 500, generation: 300 } });
    expect(after.generation.fellBack - before.generation.fellBack).toBeGreaterThanOrEqual(1);
    expect((after.generation.failuresByStage.schema ?? 0) - (before.generation.failuresByStage.schema ?? 0)).toBeGreaterThanOrEqual(1);
    expect(after.generation.bySkill).toContainEqual({ skill: { slug: skill.slug, name: "Test" }, rung: 2, succeeded: 0, fellBack: 1, pending: 0 });
    expect(JSON.stringify(after)).not.toContain(learner.email); // counts only, never who
  });

  it("reports one course's content coverage and per-skill averages exactly", async () => {
    const auth = await admin();
    const course = await createCourse();
    const [covered, empty] = [await createSkill(course.id), await createSkill(course.id)];
    await db.insert(exercises).values([1, 3].map((rung) => ({ ...exerciseRow(covered.id, rung), status: "verified" as const })));
    for (const writingScore of [0.2, 0.6]) {
      const learner = await createUser();
      await db.insert(masteryRecords).values({ userId: learner.id, skillId: covered.id, languageCode: "cpp", decayLambda: 0.05, writingScore, writingEvidenceAt: new Date() });
    }

    const { content, outcomes } = (await overviewFor(auth, `?course=${course.slug}&days=7`)).data;
    const of = <T extends { skill: { slug: string } }>(list: T[], slug: string) => list.find((s) => s.skill.slug === slug)!;
    expect(of(content.skills, covered.slug)).toMatchObject({ byRung: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 0 }, total: 2 });
    expect(of(content.skills, empty.slug).total).toBe(0);
    expect(content.skillsWithoutExercises).toBe(1);
    expect(of(outcomes.skills, covered.slug)).toMatchObject({ learners: 2, cleared: 0 });
    expect(of(outcomes.skills, covered.slug).avgWriting).toBeCloseTo(0.4, 3);
    expect(of(outcomes.skills, empty.slug)).toMatchObject({ learners: 0, avgWriting: 0 });
  });

  it("scores calibration per dimension: the Brier score and predicted against observed, in fifths", async () => {
    const auth = await admin();
    const course = await createCourse();
    const { id: skillId } = await createSkill(course.id);
    const tries = [[1, 0.5, "AC"], [3, 0.1, "WA"], [3, 0.3, "AC"], [5, 0.9, "AC"], [2, 0.95, "WA"], [4, 1, "AC"]] as const;
    for (const [rung, predicted, verdict] of tries) {
      const attempt = await createAttempt(); // only for a submission to point at
      const [submission] = await db
        .insert(submissions)
        .values({ attemptId: attempt.id, userId: attempt.userId, exerciseId: attempt.exerciseId, languageCode: "cpp", answerSha256: "x", idempotencyKey: randomUUID(), status: "completed", verdict })
        .returning();
      await db.insert(calibrationRecords).values({
        userId: attempt.userId,
        skillId,
        languageCode: "cpp",
        exerciseId: attempt.exerciseId,
        submissionId: submission.id,
        rung,
        predictedReading: rung === 1 ? predicted : 0,
        predictedWriting: rung === 1 ? 0 : predicted,
        observedVerdict: verdict,
      });
    }

    const { reading, writing } = (await overviewFor(auth, `?course=${course.slug}&days=7`)).data.calibration;
    expect(reading).toEqual({ tries: 1, brier: 0.25, bins: [{ from: 0.4, to: 0.6, n: 1, meanPredicted: 0.5, passRate: 1 }] });
    expect(writing.tries).toBe(5);
    expect(writing.brier).toBeCloseTo((0.01 + 0.49 + 0.01 + 0.9025 + 0) / 5, 6);
    expect(writing.bins.map((b: { from: number; n: number; passRate: number }) => [b.from, b.n, b.passRate])).toEqual([[0, 1, 0], [0.2, 1, 1], [0.8, 3, 2 / 3]]);
    expect(writing.bins[2].meanPredicted).toBeCloseTo(0.95, 6); // 1.0 falls in the top fifth

    const none = (await overviewFor(auth, `?course=${(await createCourse()).slug}&days=7`)).data.calibration;
    expect(none.writing).toEqual({ tries: 0, brier: null, bins: [] });
  });

  it("lists the hardest practice exercises, lowest solve rate first", async () => {
    const auth = await admin();
    const course = await createCourse();
    const skill = await createSkill(course.id);
    const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id), status: "verified" }).returning();
    for (let i = 0; i < 3; i++) {
      const learner = await createUser();
      const [enrollment] = await db.insert(enrollments).values({ userId: learner.id, courseId: course.id, languageCode: "cpp" }).returning();
      await db.insert(exerciseAttempts).values({ userId: learner.id, enrollmentId: enrollment.id, exerciseId: exercise.id, hintCeiling: 5 });
    }

    const { hardest } = (await overviewFor(auth, `?course=${course.slug}`)).data;
    expect(hardest.length).toBeGreaterThan(0);
    expect(hardest.length).toBeLessThanOrEqual(5);
    for (const h of hardest) expect(h.attempts).toBeGreaterThanOrEqual(3);
    expect(hardest.map((h: { solveRate: number }) => h.solveRate)).toEqual([...hardest.map((h: { solveRate: number }) => h.solveRate)].sort((a, b) => a - b));
  });

  it("accepts a window of 1 to 365 days", async () => {
    const auth = await admin();
    const { slug } = await createCourse();
    expect((await overviewFor(auth, `?course=${slug}&days=7`)).data.window.days).toBe(7);
    await overviewFor(auth, `?course=${slug}&days=0`, 400);
    await overviewFor(auth, `?course=${slug}&days=400`, 400);
  });
});
