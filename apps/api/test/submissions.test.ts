import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import {
  exerciseAttempts,
  exerciseSecrets,
  exerciseTests,
  submissions,
  users,
} from "../src/infrastructure/database/schema/index.js";
import { enqueueSubmission } from "../src/infrastructure/queue/submissions-queue.js";
import type { RunResult, SandboxProvider, TestRun } from "../src/infrastructure/sandbox/sandbox-provider.js";
import { runSubmission } from "../src/modules/m7_execution/services/run-submission.js";
import { signAccessToken } from "../src/shared/auth/tokens.js";
import { createAttempt } from "./helpers.js";

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
const submissionRow = async (id: string) => (await db.select().from(submissions).where(eq(submissions.id, id)))[0];

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
});
