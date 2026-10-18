import { and, eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { exerciseAttempts, exerciseHints, exercises, exerciseSecrets, exerciseTests, hintEvents } from "../src/infrastructure/database/schema/index.js";
import { geminiProvider } from "../src/infrastructure/llm/gemini-provider.js";
import { logCall } from "../src/infrastructure/llm/llm-log.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

vi.mock("../src/infrastructure/llm/gemini-provider.js", () => ({ geminiProvider: { generate: vi.fn() } }));
const generate = vi.mocked(geminiProvider.generate);

const REFERENCE = `int digitSum(int n) {
    int sum = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}
`;

// A logged live call, as the real provider writes one.
const fakeCall = () =>
  logCall({ purpose: "hint", model: "fake", promptVersion: "test", inputTokens: 10, outputTokens: 10, latencyMs: 1, status: "ok", estCostInr: "0.0100" });
// The fake tutor replies with this text.
const tutorSays = (text: string) => generate.mockImplementation(async () => ({ text, callId: await fakeCall() }));

// A learner who opened a verified practice exercise (stage 1: hint ceiling 5). Level 2 has a frozen hint.
async function learnerOnExercise() {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const skill = await createSkill(course.id);
  const [exercise] = await db.insert(exercises).values({ ...exerciseRow(skill.id), status: "verified", starterCode: "int digitSum(int n) {\n    return 0;\n}\n" }).returning();
  await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "h", referenceSolution: REFERENCE });
  await db.insert(exerciseTests).values({ exerciseId: exercise.id, seq: 1, name: "Example", size: "small", visibility: "sample", input: "123", expectedOutput: "6" });
  await db.insert(exerciseHints).values({ exerciseId: exercise.id, level: 2, bodyMd: "FROZEN level 2", source: "pregenerated", filterPassed: true });
  const user = await createUser();
  const auth = await bearerFor(user.id);
  const attempt = (await request(app).get(`/api/v1/exercises/${exercise.id}`).set("Authorization", auth).expect(200)).body.data.attempt;
  const ask = async (status = 200, code = "int digitSum(int n) {\n    return n;\n}\n") =>
    (await request(app).post(`/api/v1/exercises/${exercise.id}/hints`).set("Authorization", auth).send({ code }).expect(status)).body;
  const setAttempt = (values: Partial<typeof exerciseAttempts.$inferInsert>) => db.update(exerciseAttempts).set(values).where(eq(exerciseAttempts.id, attempt.id));
  const events = () => db.select().from(hintEvents).where(eq(hintEvents.attemptId, attempt.id)).orderBy(hintEvents.id);
  return { exercise, user, auth, attempt, ask, setAttempt, events };
}

describe("POST /exercises/:id/hints", () => {
  it("gives the live tutor's hint for the next level only, and moves the level", async () => {
    const t = await learnerOnExercise();
    tutorSays("Think about how to get the **last digit** of a number.");
    expect((await t.ask()).data.hint).toEqual({ level: 1, ceiling: 5, bodyMd: "Think about how to get the **last digit** of a number.", source: "live" });
    expect(generate.mock.calls.at(-1)![0].prompt).toContain("return n;"); // the tutor sees the learner's code

    const [attempt] = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.id, t.attempt.id));
    expect(attempt.hintLevel).toBe(1);
    const [event] = await t.events();
    expect(event).toMatchObject({ level: 1, kind: "delivered", filterResult: { passed: true } });
    expect(event.llmCallId).not.toBeNull();
  });

  it("blocks a reply that gives the solution away and serves the frozen hint instead", async () => {
    const t = await learnerOnExercise();
    await t.setAttempt({ hintLevel: 1 });
    tutorSays(`Just write this:\n\`\`\`cpp\n${REFERENCE}\`\`\``);
    expect((await t.ask()).data.hint).toMatchObject({ level: 2, bodyMd: "FROZEN level 2", source: "frozen" });
    expect((await t.events()).map((e) => e.kind)).toEqual(["blocked", "delivered"]);
  });

  it("falls back to a general nudge when the tutor fails and nothing is stored", async () => {
    const t = await learnerOnExercise();
    generate.mockRejectedValueOnce(new Error("Gemini down"));
    expect((await t.ask()).data.hint).toMatchObject({ level: 1, source: "generic" });
  });

  it("refuses a level above the fade stage's ceiling, and logs it", async () => {
    const t = await learnerOnExercise();
    await t.setAttempt({ hintLevel: 2, hintCeiling: 2 });
    expect((await t.ask(409)).error.code).toBe("HINT_LIMIT");
    expect((await t.events()).map((e) => e.kind)).toEqual(["denied_ceiling"]);
  });

  it("shows the answer at level 5 without the tutor, and marks the bottom-out", async () => {
    const t = await learnerOnExercise();
    await t.setAttempt({ hintLevel: 4 });
    generate.mockClear();
    const { hint } = (await t.ask()).data;
    expect(hint).toMatchObject({ level: 5, source: "answer" });
    expect(hint.bodyMd).toContain("sum += n % 10;");
    expect(generate).not.toHaveBeenCalled();
    const [attempt] = await db.select().from(exerciseAttempts).where(eq(exerciseAttempts.id, t.attempt.id));
    expect(attempt.bottomedOut).toBe(true);
    expect((await t.events()).map((e) => e.kind)).toEqual(["bottomed_out"]);
  });

  it("stops calling the tutor after 20 live hints in a day", async () => {
    const t = await learnerOnExercise();
    const callIds = await Promise.all(Array.from({ length: 20 }, fakeCall));
    await db.insert(hintEvents).values(callIds.map((llmCallId) => ({ attemptId: t.attempt.id, level: 1, kind: "blocked" as const, llmCallId })));
    generate.mockClear();
    expect((await t.ask()).data.hint.source).toBe("generic");
    expect(generate).not.toHaveBeenCalled();
  });

  it("needs an open attempt on a practice exercise", async () => {
    const t = await learnerOnExercise();
    const stranger = await bearerFor((await createUser()).id);
    const res = await request(app).post(`/api/v1/exercises/${t.exercise.id}/hints`).set("Authorization", stranger).send({}).expect(404);
    expect(res.body.error.code).toBe("ATTEMPT_NOT_FOUND");

    await t.setAttempt({ status: "solved" });
    expect((await t.ask(409)).error.code).toBe("ATTEMPT_CLOSED");

    await db.update(exercises).set({ purpose: "diagnostic" }).where(and(eq(exercises.id, t.exercise.id)));
    expect((await t.ask(404)).error.code).toBe("EXERCISE_NOT_FOUND");
  });
});
