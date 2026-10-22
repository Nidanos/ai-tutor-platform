import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  calibrationRecords,
  evidenceEvents,
  exerciseAttempts,
  exercises,
  exerciseSecrets,
  masteryRecords,
  exerciseTests,
  runTestResults,
  sandboxRuns,
  submissions,
  users,
} from "../src/infrastructure/database/schema/index.js";
import { enqueueSubmission } from "../src/infrastructure/queue/submissions-queue.js";
import type { RunResult, SandboxProvider, TestRun } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { runSubmission } from "../src/modules/m7_execution/services/run-submission.js";
import { signAccessToken } from "../src/shared/auth/tokens.js";
import { createAttempt, exerciseRow } from "./helpers.js";

// No Redis in tests: we check what gets queued, then run the worker's job ourselves.
vi.mock("../src/infrastructure/queue/submissions-queue.js", () => ({ enqueueSubmission: vi.fn() }));

const SUBMISSIONS = "/api/v1/submissions";

// A learner signed in (Bearer token) with an active attempt on an exercise with 1 sample + 1 hidden test.
async function learnerWithAttempt() {
  const attempt = await createAttempt();
  await db.insert(exerciseSecrets).values({ exerciseId: attempt.exerciseId, harnessCode: "harness", referenceSolution: "-" });
  await db.insert(exerciseTests).values([
    { exerciseId: attempt.exerciseId, seq: 1, name: "Example", size: "small", visibility: "sample", input: "123", expectedOutput: "6" },
    { exerciseId: attempt.exerciseId, seq: 2, name: "Big", size: "small", visibility: "hidden", input: "999", expectedOutput: "27" },
  ]);
  return { attempt, api: await apiFor(attempt.userId) };
}

async function apiFor(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const token = await signAccessToken({ userId, role: user.role, orgId: user.orgId });
  const ip = `10.1.${randomInt(256)}.${randomInt(256)}`;
  return {
    post: (body: object) => request(app).post(SUBMISSIONS).set("Authorization", `Bearer ${token}`).set("X-Forwarded-For", ip).send(body),
    result: (id: string) => request(app).get(`${SUBMISSIONS}/${id}/result`).set("Authorization", `Bearer ${token}`),
  };
}

const submit = async (api: Awaited<ReturnType<typeof apiFor>>, attemptId: string) =>
  (await api.post({ attemptId, answer: "int f() {}", idempotencyKey: randomUUID() }).expect(202)).body.data.submissionId as string;

const passed = (stdout: string): TestRun => ({ exitCode: 0, timedOut: false, timeMs: 3, peakMemoryKb: 900, stdout, stderr: "" });
const sandbox = (result: Partial<RunResult>): SandboxProvider => ({
  run: async () => ({ sandboxId: "fake", compile: { ok: true, output: "" }, tests: [], ...result }),
});
const brokenSandbox: SandboxProvider = { run: () => Promise.reject(new Error("sandbox down")) };
const evidenceOf = (userId: string) =>
  db.select().from(evidenceEvents).where(eq(evidenceEvents.userId, userId)).orderBy(evidenceEvents.id);
const calibrationOf = (userId: string) => db.select().from(calibrationRecords).where(eq(calibrationRecords.userId, userId));
const masteryOf = async (userId: string) => (await db.select().from(masteryRecords).where(eq(masteryRecords.userId, userId)))[0];
const failed = (stdout: string): TestRun => ({ ...passed(stdout), stdout: "wrong" });
const submissionRow = async (id: string) => (await db.select().from(submissions).where(eq(submissions.id, id)))[0];
// What a submission's run kept: compiler text, and per test its error and program output.
async function runTextOf(submissionId: string) {
  const [run] = await db.select().from(sandboxRuns).where(eq(sandboxRuns.submissionId, submissionId));
  const results = await db.select().from(runTestResults).where(eq(runTestResults.runId, run.id)).orderBy(runTestResults.id);
  return { compileOutput: run.compileOutput, stderr: results.map((r) => r.stderrExcerpt), stdout: results.map((r) => r.stdoutExcerpt) };
}

describe("submissions", () => {
  it("saves and queues a submission, answering 202", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const res = await api.post({ attemptId: attempt.id, answer: "int f() {}", idempotencyKey: randomUUID() }).expect(202);
    expect(res.body.data.status).toBe("queued");
    expect(enqueueSubmission).toHaveBeenCalledWith(res.body.data.submissionId);
  });

  it("returns the same submission for a repeated idempotency key, counted once", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const body = { attemptId: attempt.id, answer: "int f() {}", idempotencyKey: randomUUID() };
    const first = (await api.post(body).expect(202)).body.data.submissionId;
    const second = (await api.post(body).expect(202)).body.data.submissionId;
    expect(second).toBe(first);
    const [row] = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.id, attempt.id));
    expect(row.submissionCount).toBe(1);
  });

  it("refuses a key already used on another attempt, so no attempt can borrow another's verdict", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const [{ skillId }] = await db.select().from(exercises).where(eq(exercises.id, attempt.exerciseId));
    const [other] = await db.insert(exercises).values({ ...exerciseRow(skillId), variantSeed: 2 }).returning();
    const [second] = await db
      .insert(exerciseAttempts)
      .values({ userId: attempt.userId, enrollmentId: attempt.enrollmentId, exerciseId: other.id, hintCeiling: 3 })
      .returning();
    const idempotencyKey = randomUUID();
    await api.post({ attemptId: attempt.id, answer: "x", idempotencyKey }).expect(202);
    const res = await api.post({ attemptId: second.id, answer: "x", idempotencyKey }).expect(409);
    expect(res.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
  });

  it("hides other learners' attempts and submissions", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const id = await submit(api, attempt.id);
    const stranger = await apiFor((await createAttempt()).userId);
    const res = await stranger.post({ attemptId: attempt.id, answer: "x", idempotencyKey: randomUUID() }).expect(404);
    expect(res.body.error.code).toBe("ATTEMPT_NOT_FOUND");
    await stranger.result(id).expect(404);
  });

  it("judges a run, shows the sample test in full and the hidden test as a verdict only", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const id = await submit(api, attempt.id);
    expect((await api.result(id).expect(200)).body.data.status).toBe("queued");

    await runSubmission(id, false, sandbox({ tests: [passed("6\n"), passed("27\n")] }));
    const { data } = (await api.result(id).expect(200)).body;
    expect(data).toMatchObject({ status: "completed", verdict: "AC", testsPassed: 2, testsTotal: 2 });
    expect(data.tests[0]).toMatchObject({ visibility: "sample", input: "123", expectedOutput: "6", output: "6\n" });
    expect(data.tests[1]).toEqual({ seq: 2, name: "Big", visibility: "hidden", verdict: "AC", timeMs: 3 });

    const closed = await api.post({ attemptId: attempt.id, answer: "x", idempotencyKey: randomUUID() }).expect(409);
    expect(closed.body.error.code).toBe("ATTEMPT_CLOSED"); // solved attempts take no more submissions
  });

  it("shows compiler output for CE, and doesn't count it before the third", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const id = await submit(api, attempt.id);
    await runSubmission(id, false, sandbox({ compile: { ok: false, output: "error: expected ';'" } }));
    expect((await api.result(id)).body.data).toMatchObject({ verdict: "CE", compileOutput: "error: expected ';'" });
    expect((await submissionRow(id)).countsAsAttempt).toBe(false);
  });

  it("retries a sandbox failure, then gives SE without counting it", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const id = await submit(api, attempt.id);
    await expect(runSubmission(id, false, brokenSandbox)).rejects.toThrow("sandbox down");
    expect((await submissionRow(id)).status).toBe("queued");

    await runSubmission(id, true, brokenSandbox);
    expect(await submissionRow(id)).toMatchObject({ status: "completed", verdict: "SE", countsAsAttempt: false });
  });

  it("turns an AC into writing mastery, saved with its ledger row", async () => {
    const { attempt, api } = await learnerWithAttempt(); // rung 3, no hints
    await runSubmission(await submit(api, attempt.id), false, sandbox({ tests: [passed("6"), passed("27")] }));
    expect((await masteryOf(attempt.userId)).writingScore).toBeCloseTo(0.24); // 0.4 × 3/5
    expect(await evidenceOf(attempt.userId)).toMatchObject([{ verdict: "AC", scoreBefore: 0, formulaVersion: "m4-v1" }]);
  });

  it("penalises only the first wrong answer of an attempt", async () => {
    const { attempt, api } = await learnerWithAttempt();
    for (let i = 0; i < 2; i++) {
      await runSubmission(await submit(api, attempt.id), false, sandbox({ tests: [failed("6"), passed("27")] }));
    }
    const [first, second] = await evidenceOf(attempt.userId);
    expect(first).toMatchObject({ verdict: "WA", scoreBefore: 0, scoreAfter: 0 }); // nothing to lose yet
    expect(second.weight).toBe(0); // the repeat was recorded, but not penalised
  });

  it("records no evidence for SE or an early compile error", async () => {
    const { attempt, api } = await learnerWithAttempt();
    await runSubmission(await submit(api, attempt.id), true, brokenSandbox);
    await runSubmission(await submit(api, attempt.id), false, sandbox({ compile: { ok: false, output: "error" } }));
    expect(await evidenceOf(attempt.userId)).toEqual([]);
  });

  it("saves a calibration record for a learner's first counted try at an exercise only (ADR-0021)", async () => {
    const { attempt, api } = await learnerWithAttempt(); // rung 3
    await runSubmission(await submit(api, attempt.id), false, sandbox({ compile: { ok: false, output: "error" } })); // not a try yet
    const first = await submit(api, attempt.id);
    await runSubmission(first, false, sandbox({ tests: [failed("6"), passed("27")] }));
    await runSubmission(await submit(api, attempt.id), false, sandbox({ tests: [passed("6"), passed("27")] }));
    // Coming back to the solved exercise in a new attempt isn't a first try either.
    const [again] = await db
      .insert(exerciseAttempts)
      .values({ userId: attempt.userId, enrollmentId: attempt.enrollmentId, exerciseId: attempt.exerciseId, hintCeiling: 3 })
      .returning();
    await runSubmission(await submit(api, again.id), false, sandbox({ tests: [passed("6"), passed("27")] }));

    expect(await calibrationOf(attempt.userId)).toMatchObject([
      { submissionId: first, exerciseId: attempt.exerciseId, rung: 3, predictedReading: 0, predictedWriting: 0, observedVerdict: "WA" },
    ]);
  });

  it("calibrates only one of two first tries graded at the same time", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const ids = [await submit(api, attempt.id), await submit(api, attempt.id)];
    await Promise.all(ids.map((id) => runSubmission(id, false, sandbox({ tests: [failed("6"), passed("27")] }))));
    expect(await calibrationOf(attempt.userId)).toHaveLength(1);
  });

  it("predicts from today's scores, decayed since their last evidence", async () => {
    const { attempt, api } = await learnerWithAttempt();
    const [{ skillId }] = await db.select({ skillId: exercises.skillId }).from(exercises).where(eq(exercises.id, attempt.exerciseId));
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000);
    await db.insert(masteryRecords).values({
      userId: attempt.userId,
      skillId,
      languageCode: "cpp",
      decayLambda: 0.05,
      readingScore: 0.8,
      readingEvidenceAt: tenDaysAgo,
      writingScore: 0.5,
      writingEvidenceAt: tenDaysAgo,
    });
    await runSubmission(await submit(api, attempt.id), false, sandbox({ tests: [passed("6"), passed("27")] }));

    const [record] = await calibrationOf(attempt.userId);
    expect(record.predictedReading).toBeCloseTo(0.8 * Math.exp(-0.5), 6); // 0.05 a day for 10 days
    expect(record.predictedWriting).toBeCloseTo(0.5 * Math.exp(-0.5), 6);
    expect(record.observedVerdict).toBe("AC");
  });

  it("deletes the learner's code for a skill once it is cleared, keeping every verdict (privacy policy §2)", async () => {
    const { attempt, api } = await learnerWithAttempt(); // rung 3
    const early = await submit(api, attempt.id);
    const quoting = { compile: { ok: true, output: "solution.cpp:1:5: warning: int f() {}" } }; // compilers quote the code
    await runSubmission(early, false, sandbox({ ...quoting, tests: [{ ...failed("6"), stderr: "assert(n > 0) failed" }, passed("27")] }));
    const pending = await submit(api, attempt.id); // still queued when the skill clears, as from another tab

    // A rung-5 build solved with no hint clears the skill (ADR-0007).
    const [{ skillId }] = await db.select({ skillId: exercises.skillId }).from(exercises).where(eq(exercises.id, attempt.exerciseId));
    const [build] = await db.insert(exercises).values(exerciseRow(skillId, 5)).returning();
    await db.insert(exerciseSecrets).values({ exerciseId: build.id, harnessCode: "harness", referenceSolution: "-" });
    await db.insert(exerciseTests).values({ exerciseId: build.id, seq: 1, name: "Example", size: "small", visibility: "sample", input: "1", expectedOutput: "1" });
    const [buildAttempt] = await db
      .insert(exerciseAttempts)
      .values({ userId: attempt.userId, enrollmentId: attempt.enrollmentId, exerciseId: build.id, hintCeiling: 3 })
      .returning();
    const clearing = await submit(api, buildAttempt.id);
    await runSubmission(clearing, false, sandbox({ ...quoting, tests: [passed("1")] }));

    expect((await masteryOf(attempt.userId)).clearedAt).not.toBeNull();
    for (const [id, verdict] of [[early, "WA"], [clearing, "AC"]]) {
      const row = await submissionRow(id);
      expect(row).toMatchObject({ answer: null, verdict });
      expect(row.answerPurgedAt).not.toBeNull();
      expect(row.answerSha256).toMatch(/^[0-9a-f]{64}$/); // the fingerprint stays
    }
    const earlyResult = (await api.result(early)).body.data;
    expect(await runTextOf(early)).toEqual({ compileOutput: null, stderr: [null, null], stdout: ["wrong", "27"] }); // program output isn't code
    expect(earlyResult.tests[0]).toMatchObject({ verdict: "WA", output: "wrong" });
    expect((await runTextOf(clearing)).compileOutput).toBe(quoting.compile.output); // just graded: its result stays readable

    expect((await submissionRow(pending)).answer).toBe("int f() {}"); // still needed to run it
    await runSubmission(pending, false, sandbox({ tests: [passed("6"), passed("27")] }));
    expect((await submissionRow(pending)).answer).toBeNull(); // practice after clearing goes once graded
    expect((await runTextOf(clearing)).compileOutput).toBeNull(); // and the previous result's compiler text goes with it

    // A retried job finds the verdict saved and only purges: e.g. when the purge failed after the commit.
    await db.update(submissions).set({ answer: "int f() {}" }).where(eq(submissions.id, early));
    await runSubmission(clearing, false, sandbox({ tests: [] }));
    expect((await submissionRow(early)).answer).toBeNull();
  });
});
