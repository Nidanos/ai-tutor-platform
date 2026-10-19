import { and, eq, isNotNull } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  diagnosticAttempts,
  diagnosticItems,
  diagnosticResponses,
  evidenceEvents,
  exerciseAttempts,
  exercises,
  exerciseSecrets,
  exerciseTests,
  fadeStageChanges,
  masteryRecords,
  skillPrerequisites,
  skillScaffolding,
  submissions,
} from "../src/infrastructure/database/schema/index.js";
import { enqueueSubmission } from "../src/infrastructure/queue/submissions-queue.js";
import type { SandboxProvider } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { seedFromDiagnostic } from "../src/modules/m4_mastery/services/mastery.service.js";
import { runSubmission } from "../src/modules/m7_execution/services/run-submission.js";
import { getStage } from "../src/modules/m12_scaffolding/services/scaffolding.service.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

vi.mock("../src/infrastructure/queue/submissions-queue.js", () => ({ enqueueSubmission: vi.fn() }));

const sandboxPrinting = (stdout: string): SandboxProvider => ({
  run: async () => ({ sandboxId: "fake", compile: { ok: true, output: "" }, tests: [{ exitCode: 0, timedOut: false, timeMs: 1, peakMemoryKb: 1, stdout, stderr: "" }] }),
});

// A verified diagnostic exercise with one test, and its placement item.
async function item(skillId: string, dimension: "reading" | "writing", expectedOutput: string) {
  const rung = dimension === "reading" ? 1 : 5;
  const [exercise] = await db
    .insert(exercises)
    .values({ ...exerciseRow(skillId, rung), variantSeed: 100, purpose: "diagnostic", status: "verified" })
    .returning();
  await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: rung > 1 ? "h" : null, referenceSolution: "r" });
  await db.insert(exerciseTests).values({ exerciseId: exercise.id, seq: 1, name: "t", size: "small", visibility: "sample", expectedOutput });
  const [row] = await db
    .insert(diagnosticItems)
    .values({ skillId, languageCode: "cpp", dimension, difficulty: 1, promptMd: "What does it print?", payload: { code: "int main() {}" }, exerciseId: exercise.id, contentVersion: "v1" })
    .returning();
  return row;
}

// A course of two skills (second needs first), each with a reading item (prints forty-two) and a writing item (prints 6).
async function placementCourse() {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const [first, second] = [await createSkill(course.id), await createSkill(course.id)];
  await db.insert(skillPrerequisites).values({ skillId: second.id, prerequisiteId: first.id });
  const items = {
    firstReading: await item(first.id, "reading", "forty-two"),
    firstWriting: await item(first.id, "writing", "6"),
    secondReading: await item(second.id, "reading", "forty-two"),
    secondWriting: await item(second.id, "writing", "6"),
  };
  const user = await createUser();
  const auth = await bearerFor(user.id);
  const post = async (path: string, body: object, status = 200) =>
    (await request(app).post(`/api/v1/diagnostic${path}`).set("Authorization", auth).send(body).expect(status)).body.data?.diagnostic;
  const start = (body: object = {}, status = 200) => post("/start", { course: course.slug, ...body }, status);
  return { course, first, second, items, user, auth, post, start };
}

// A prerequisite from another course (as DSA's come from C++ basics): the recommender's business, not the placement test's.
async function needsOutsideSkill(skillId: string) {
  const outside = await createSkill((await createCourse()).id);
  await db.insert(skillPrerequisites).values({ skillId, prerequisiteId: outside.id });
}

const nextStep = async (t: Awaited<ReturnType<typeof placementCourse>>) =>
  (await request(app).get(`/api/v1/recommendations/next?course=${t.course.slug}`).set("Authorization", t.auth).expect(200)).body.data.recommendation;

// Reads both skills correctly, then answers the one frontier writing task (the second skill).
async function readBothThenWrite(t: Awaited<ReturnType<typeof placementCourse>>) {
  const { diagnosticId } = await t.start();
  await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "forty-two\n" });
  const view = await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondReading.id, answer: "forty-two" });
  expect(view.question).toMatchObject({ itemId: t.items.secondWriting.id, dimension: "writing" });
  await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondWriting.id, answer: "int main() { return 6; }" });
  const [response] = await db
    .select()
    .from(diagnosticResponses)
    .where(and(eq(diagnosticResponses.diagnosticId, diagnosticId), eq(diagnosticResponses.itemId, t.items.secondWriting.id)));
  return { diagnosticId, submissionId: response.submissionId! };
}

describe("POST /diagnostic/start", () => {
  it("asks a skill whose prerequisite comes from another course", async () => {
    const t = await placementCourse();
    await needsOutsideSkill(t.first.id);
    const { question } = await t.start();
    expect(question.itemId).toBe(t.items.firstReading.id);
  });

  it("starts with the first skill's program to read, never its answer, and resumes the same test", async () => {
    const t = await placementCourse();
    const first = await t.start();
    expect(first).toMatchObject({ attemptNo: 1, status: "in_progress", answered: 0, question: { itemId: t.items.firstReading.id, dimension: "reading", code: "int main() {}" } });
    expect(JSON.stringify(first)).not.toContain("forty-two");
    expect((await t.start()).diagnosticId).toBe(first.diagnosticId);
  });

  it("is unavailable until items are verified, and 404 for an unknown course", async () => {
    const t = await placementCourse();
    await db.update(exercises).set({ status: "draft" }).where(eq(exercises.skillId, t.first.id));
    await db.update(exercises).set({ status: "draft" }).where(eq(exercises.skillId, t.second.id));
    const res = await request(app).post("/api/v1/diagnostic/start").set("Authorization", t.auth).send({ course: t.course.slug }).expect(503);
    expect(res.body.error.code).toBe("DIAGNOSTIC_UNAVAILABLE");
    await t.start({ course: "no-such-course" }, 404);
    await t.start({ language: "python" }, 404); // a language this course isn't offered in
  });
});

describe("POST /diagnostic/:id/answers", () => {
  it("grades reading on the spot without saying so, and accepts only the current question", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await t.start();
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondReading.id, answer: "forty-two" }, 409);

    const next = await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "forty-two\n" });
    expect(next).toMatchObject({ answered: 1, question: { itemId: t.items.secondReading.id } });
    expect(JSON.stringify(next)).not.toMatch(/isCorrect|correct/i);
    const replay = await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "wrong" });
    expect(replay).toEqual(next);
    const [row] = await db.select().from(diagnosticResponses).where(eq(diagnosticResponses.itemId, t.items.firstReading.id));
    expect(row).toMatchObject({ seq: 1, isCorrect: true, answer: { output: "forty-two\n" } });

    const stranger = await bearerFor((await createUser()).id);
    await request(app).post(`/api/v1/diagnostic/${diagnosticId}/answers`).set("Authorization", stranger).send({ itemId: t.items.secondReading.id, answer: "forty-two" }).expect(404);
  });

  it("rejects an answer Postgres can't store as a 400, not a 500", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await t.start();
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "forty\u0000two" }, 400);
  });

  it("re-queues a code task whose first queueing failed when the answer is retried", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await t.start();
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "forty-two" });
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondReading.id, answer: "forty-two" });
    vi.mocked(enqueueSubmission).mockClear().mockRejectedValueOnce(new Error("redis down"));
    const code = { itemId: t.items.secondWriting.id, answer: "int main() { return 6; }" };
    await t.post(`/${diagnosticId}/answers`, code, 500);
    await t.post(`/${diagnosticId}/answers`, code);
    expect(vi.mocked(enqueueSubmission)).toHaveBeenCalledTimes(2);
    expect(await db.select().from(submissions).where(eq(submissions.userId, t.user.id))).toHaveLength(1);
  });

  it("ends after an \"I don't know\" on the first skill, with nothing asked on top of it", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await t.start();
    expect((await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, dontKnow: true })).question).toBeUndefined();
  });

  it("queues a code task once, in a diagnostic attempt with no hints and no fade stage", async () => {
    const t = await placementCourse();
    vi.mocked(enqueueSubmission).mockClear();
    const { diagnosticId, submissionId } = await readBothThenWrite(t);
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondWriting.id, answer: "int main() { return 6; }" }); // double click

    expect(await db.select().from(submissions).where(eq(submissions.userId, t.user.id))).toHaveLength(1);
    expect(vi.mocked(enqueueSubmission)).toHaveBeenCalledTimes(1);
    const [attempt] = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, t.user.id));
    expect(attempt).toMatchObject({ context: "diagnostic", hintCeiling: 0 });
    const [response] = await db.select().from(diagnosticResponses).where(eq(diagnosticResponses.submissionId, submissionId));
    expect(response).toMatchObject({ answer: {}, isCorrect: null });
    expect(await db.select().from(skillScaffolding).where(eq(skillScaffolding.userId, t.user.id))).toHaveLength(0);
  });
});

describe("POST /diagnostic/:id/complete", () => {
  it("waits for the code task, then seeds mastery and fast-tracks the skills it proves", async () => {
    const t = await placementCourse();
    const { diagnosticId, submissionId } = await readBothThenWrite(t);
    const waiting = await request(app).post(`/api/v1/diagnostic/${diagnosticId}/complete`).set("Authorization", t.auth).expect(202);
    expect(waiting.body.data.diagnostic).toMatchObject({ status: "grading", retryAfterMs: 5000 });

    await runSubmission(submissionId, false, sandboxPrinting("6"));
    expect(await db.select().from(evidenceEvents).where(eq(evidenceEvents.submissionId, submissionId))).toHaveLength(0); // the test is not practice

    const done = await t.post(`/${diagnosticId}/complete`, {});
    expect(done.status).toBe("completed");
    expect(done.results).toEqual([
      { skill: expect.objectContaining({ id: t.first.id }), estReading: 0.85, estWriting: 0.85, confidence: 0.5 },
      { skill: expect.objectContaining({ id: t.second.id }), estReading: 0.85, estWriting: 0.85, confidence: 1 },
    ]);

    const evidence = await db.select().from(evidenceEvents).where(eq(evidenceEvents.diagnosticId, diagnosticId));
    expect(evidence).toHaveLength(4);
    expect(evidence.every((e) => e.scoreAfter === 0.85 && e.formulaVersion === "m3-v1" && e.submissionId === null)).toBe(true);
    const records = await db.select().from(masteryRecords).where(eq(masteryRecords.userId, t.user.id));
    expect(records.every((r) => r.attemptCount === 0 && r.clearedAt === null)).toBe(true);
    const stages = await db.select().from(skillScaffolding).where(eq(skillScaffolding.userId, t.user.id));
    expect(stages.map((s) => s.currentStage)).toEqual([4, 4]);
    const [change] = await db.select().from(fadeStageChanges).where(eq(fadeStageChanges.userId, t.user.id));
    expect(change).toMatchObject({ toStage: 4, reason: "diagnostic", submissionId: null });

    // Done is done: answering is closed, completing again changes nothing, start shows the result.
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstWriting.id, answer: "x" }, 409);
    expect(await t.post(`/${diagnosticId}/complete`, {})).toEqual(done);
    expect(await db.select().from(evidenceEvents).where(eq(evidenceEvents.diagnosticId, diagnosticId))).toHaveLength(4);
    expect(await t.start()).toEqual(done);
    expect(await nextStep(t)).toMatchObject({ rung: 5 }); // fast-tracked: straight to Build
  });

  it("starts a skill only read correctly at rung 2: Predict is skipped, writing still starts at 0", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await t.start();
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "forty-two" });
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondReading.id, dontKnow: true });
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstWriting.id, dontKnow: true }); // "Skip this task"
    await t.post(`/${diagnosticId}/complete`, {});
    expect(await nextStep(t)).toMatchObject({ skill: { id: t.first.id }, rung: 2 });
    expect(await db.select().from(skillScaffolding).where(eq(skillScaffolding.userId, t.user.id))).toHaveLength(0);
  });

  it("raises a practised skill without lowering it, so the skills built on it unlock", async () => {
    const t = await placementCourse();
    await db.insert(masteryRecords).values({ userId: t.user.id, skillId: t.first.id, languageCode: "cpp", decayLambda: 0.05, readingScore: 0.95, readingEvidenceAt: new Date(), attemptCount: 2 });
    const { diagnosticId, submissionId } = await readBothThenWrite(t);
    await runSubmission(submissionId, false, sandboxPrinting("6"));
    await t.post(`/${diagnosticId}/complete`, {});
    const [record] = await db.select().from(masteryRecords).where(and(eq(masteryRecords.userId, t.user.id), eq(masteryRecords.skillId, t.first.id)));
    expect(record).toMatchObject({ readingScore: 0.95, writingScore: 0.85, attemptCount: 2 });
    expect((await nextStep(t)).rung).toBe(5); // both skills are open, both at Build
  });

  it("leaves a skill cleared in practice alone, and doesn't ask it", async () => {
    const t = await placementCourse();
    const cleared = { userId: t.user.id, skillId: t.first.id, languageCode: "cpp", decayLambda: 0.05, writingScore: 0.9, writingEvidenceAt: new Date(), clearedAt: new Date(), attemptCount: 6 };
    await db.insert(masteryRecords).values(cleared);
    const { question } = await t.start();
    expect(question.itemId).toBe(t.items.secondReading.id);
    const [record] = await db.select().from(masteryRecords).where(and(eq(masteryRecords.userId, t.user.id), eq(masteryRecords.skillId, t.first.id)));
    expect(record).toMatchObject({ writingScore: 0.9, attemptCount: 6 });
  });

  it("won't let a practice submission stand in for the code task", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await t.start();
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.firstReading.id, answer: "forty-two" });
    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondReading.id, answer: "forty-two" });
    // A practice exercise this learner can solve, submitted under the code task's predictable key.
    const [practice] = await db.insert(exercises).values({ ...exerciseRow(t.first.id), status: "verified" }).returning();
    const opened = await request(app).get(`/api/v1/exercises/${practice.id}`).set("Authorization", t.auth).expect(200);
    const key = `diagnostic:${diagnosticId}:${t.items.secondWriting.id}`;
    await request(app).post("/api/v1/submissions").set("Authorization", t.auth).send({ attemptId: opened.body.data.attempt.id, answer: "x", idempotencyKey: key }).expect(202);

    await t.post(`/${diagnosticId}/answers`, { itemId: t.items.secondWriting.id, answer: "junk" }, 409);
    expect(await db.select().from(diagnosticResponses).where(eq(diagnosticResponses.itemId, t.items.secondWriting.id))).toHaveLength(0);
  });

  it("moves a skill opened before the test (stage 1, never submitted) up to the last stage", async () => {
    const t = await placementCourse();
    await getStage({ userId: t.user.id, skillId: t.first.id, languageCode: "cpp" }, t.course.id);
    const { diagnosticId, submissionId } = await readBothThenWrite(t);
    await runSubmission(submissionId, false, sandboxPrinting("6"));
    await t.post(`/${diagnosticId}/complete`, {});
    const [move] = await db
      .select()
      .from(fadeStageChanges)
      .where(and(eq(fadeStageChanges.userId, t.user.id), eq(fadeStageChanges.skillId, t.first.id), eq(fadeStageChanges.reason, "diagnostic")));
    expect(move).toMatchObject({ fromStage: 1, toStage: 4 });
  });

  it("stops waiting for a code task the sandbox never ran, and counts it as unobserved", async () => {
    const t = await placementCourse();
    const { diagnosticId } = await readBothThenWrite(t);
    await db.update(diagnosticResponses).set({ answeredAt: new Date(Date.now() - 121_000) }).where(isNotNull(diagnosticResponses.submissionId));
    const done = await t.post(`/${diagnosticId}/complete`, {});
    expect(done.results[1]).toEqual({ skill: expect.objectContaining({ id: t.second.id }), estReading: 0.85, estWriting: 0, confidence: 0.5 });
  });
});

describe("retake", () => {
  it("starts a new test only when asked, up to three, never lowering earlier results", async () => {
    const t = await placementCourse();
    const { diagnosticId, submissionId } = await readBothThenWrite(t);
    await runSubmission(submissionId, false, sandboxPrinting("6"));
    await t.post(`/${diagnosticId}/complete`, {});

    for (const attemptNo of [2, 3]) {
      const retake = await t.start({ retake: true });
      expect(retake).toMatchObject({ attemptNo, status: "in_progress", question: { itemId: t.items.firstReading.id } });
      await t.post(`/${retake.diagnosticId}/answers`, { itemId: t.items.firstReading.id, dontKnow: true });
      expect((await t.post(`/${retake.diagnosticId}/complete`, {})).results[0]).toMatchObject({ estReading: 0, estWriting: 0 });
    }
    const res = await request(app).post("/api/v1/diagnostic/start").set("Authorization", t.auth).send({ course: t.course.slug, retake: true }).expect(409);
    expect(res.body.error.code).toBe("DIAGNOSTIC_LIMIT");

    const records = await db.select().from(masteryRecords).where(eq(masteryRecords.userId, t.user.id));
    expect(records.every((r) => r.readingScore === 0.85 && r.writingScore === 0.85)).toBe(true);
    expect((await db.select().from(skillScaffolding).where(eq(skillScaffolding.userId, t.user.id))).map((s) => s.currentStage)).toEqual([4, 4]);
    const [{ enrollmentId }] = await db.select().from(diagnosticAttempts).where(eq(diagnosticAttempts.id, diagnosticId));
    expect(await db.select().from(diagnosticAttempts).where(eq(diagnosticAttempts.enrollmentId, enrollmentId))).toHaveLength(3);
  });

  it("lifts a placement on a retake after a failed code task, reusing the open attempt", async () => {
    const t = await placementCourse();
    const first = await readBothThenWrite(t);
    await runSubmission(first.submissionId, false, sandboxPrinting("wrong")); // WA: the attempt stays open
    expect((await t.post(`/${first.diagnosticId}/complete`, {})).results[1]).toMatchObject({ estWriting: 0 });

    const retake = await readBothThenWrite({ ...t, start: () => t.start({ retake: true }) });
    expect(retake.submissionId).not.toBe(first.submissionId);
    expect(await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.userId, t.user.id))).toHaveLength(1);
    await runSubmission(retake.submissionId, false, sandboxPrinting("6"));
    expect((await t.post(`/${retake.diagnosticId}/complete`, {})).results[1]).toMatchObject({ estWriting: 0.85 });
  });

  it("finishes cleanly for a learner who has already cleared every skill", async () => {
    const t = await placementCourse();
    for (const skill of [t.first, t.second])
      await db.insert(masteryRecords).values({ userId: t.user.id, skillId: skill.id, languageCode: "cpp", decayLambda: 0.05, writingScore: 0.9, writingEvidenceAt: new Date(), clearedAt: new Date(), attemptCount: 5 });
    const { diagnosticId, question } = await t.start();
    expect(question).toBeUndefined();
    expect(await t.post(`/${diagnosticId}/complete`, {})).toMatchObject({ status: "completed", results: [] });
  });

  it("refreshes only a seed that has faded below the new estimate", async () => {
    const t = await placementCourse();
    const { diagnosticId, submissionId } = await readBothThenWrite(t);
    await runSubmission(submissionId, false, sandboxPrinting("6"));
    await t.post(`/${diagnosticId}/complete`, {});
    const monthAgo = new Date(Date.now() - 30 * 86_400_000);
    await db.update(masteryRecords).set({ writingEvidenceAt: monthAgo }).where(eq(masteryRecords.userId, t.user.id));

    const retake = await t.start({ retake: true });
    const key = { userId: t.user.id, skillId: t.first.id, languageCode: "cpp" };
    await db.transaction((tx) => seedFromDiagnostic(tx, { ...key, diagnosticId: retake.diagnosticId, reading: 0.85, writing: 0.85, formulaVersion: "m3-v1" }));
    const evidence = await db.select().from(evidenceEvents).where(eq(evidenceEvents.diagnosticId, retake.diagnosticId));
    expect(evidence.map((e) => e.dimension)).toEqual(["writing"]); // reading is still fresh at 0.85
    const [record] = await db.select().from(masteryRecords).where(and(eq(masteryRecords.userId, t.user.id), eq(masteryRecords.skillId, t.first.id)));
    expect(record.writingEvidenceAt!.getTime()).toBeGreaterThan(monthAgo.getTime());
  });
});
