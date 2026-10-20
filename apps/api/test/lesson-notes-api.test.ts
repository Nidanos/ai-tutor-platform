import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { exercises, lessonNotes, masteryRecords, skillPrerequisites, skills, submissions } from "../src/infrastructure/database/schema/index.js";
import { geminiProvider, geminiReady } from "../src/infrastructure/llm/gemini-provider.js";
import { logCall } from "../src/infrastructure/llm/llm-log.js";
import { bearerFor, createAttempt, createSkill } from "./helpers.js";

vi.mock("../src/infrastructure/llm/gemini-provider.js", () => ({ geminiProvider: { generate: vi.fn() }, geminiReady: vi.fn(() => true) }));
const generate = vi.mocked(geminiProvider.generate);
beforeEach(() => {
  generate.mockReset();
  vi.mocked(geminiReady).mockReturnValue(true);
});

const NOTE = "Your last runs passed one test of four, so the loop's stopping point is the thing to watch. Pointers still look shaky: a quick look back first will help.";
const tutorSays = (text: string) =>
  generate.mockImplementation(async () => ({
    text,
    callId: await logCall({ purpose: "hint", model: "fake", promptVersion: "test", inputTokens: 1, outputTokens: 1, latencyMs: 1, status: "ok", estCostInr: "0.0100" }),
  }));

// A learner with one wrong run on a skill, whose prerequisite they write at 30%.
async function learnerWhoStruggles() {
  const attempt = await createAttempt();
  const [{ skillId, courseId }] = await db
    .select({ skillId: skills.id, courseId: skills.courseId })
    .from(exercises)
    .innerJoin(skills, eq(skills.id, exercises.skillId))
    .where(eq(exercises.id, attempt.exerciseId));
  const prerequisite = await createSkill(courseId);
  await db.insert(skillPrerequisites).values({ skillId, prerequisiteId: prerequisite.id });
  await db.insert(submissions).values({ attemptId: attempt.id, userId: attempt.userId, exerciseId: attempt.exerciseId, languageCode: "cpp", answer: "int mySecretAttempt() {}", answerSha256: "x", idempotencyKey: crypto.randomUUID(), status: "completed", verdict: "WA", testsPassed: 1, testsTotal: 4 });
  const mastery = (id: string, writingScore: number, attemptCount: number) =>
    db.insert(masteryRecords).values({ userId: attempt.userId, skillId: id, languageCode: "cpp", decayLambda: 0.05, writingScore, writingEvidenceAt: new Date(), attemptCount });
  await mastery(skillId, 0.1, 1);
  await mastery(prerequisite.id, 0.3, 4);
  const auth = await bearerFor(attempt.userId);
  const note = async () => (await request(app).post(`/api/v1/lessons/${skillId}/note`).set("Authorization", auth).expect(200)).body.data.note;
  return { attempt, skillId, prerequisite, note };
}

describe("POST /lessons/:skillId/note", () => {
  it("writes a note from the learner's recent results and weak prerequisite, then reuses it until they practise again", async () => {
    const { attempt, skillId, prerequisite, note } = await learnerWhoStruggles();
    tutorSays(NOTE);

    expect(await note()).toEqual({ bodyMd: NOTE });
    const { prompt, model, purpose } = generate.mock.calls[0][0];
    expect({ model, purpose }).toEqual({ model: "gemini-3.5-flash-lite", purpose: "hint" });
    expect(prompt).toContain("RECENT RESULTS ON THIS SKILL, newest first: WA 1/4");
    expect(prompt).toContain(`WEAK PREREQUISITES: ${prerequisite.name} (writing 30%, needs 70%)`);
    expect(prompt).not.toContain("mySecretAttempt"); // results only: the learner's code never goes into a note

    expect(await note()).toEqual({ bodyMd: NOTE }); // nothing new since: the same note, no call
    expect(generate).toHaveBeenCalledTimes(1);
    await db.update(masteryRecords).set({ attemptCount: 2 }).where(eq(masteryRecords.skillId, skillId));
    await note();
    expect(generate).toHaveBeenCalledTimes(2);
    expect(await db.$count(lessonNotes, eq(lessonNotes.userId, attempt.userId))).toBe(2);
  });

  it("says nothing without live AI, past the daily limit, or when the reply has code", async () => {
    const { attempt, skillId, note } = await learnerWhoStruggles();
    vi.mocked(geminiReady).mockReturnValue(false);
    expect(await note()).toBeNull();

    vi.mocked(geminiReady).mockReturnValue(true);
    tutorSays("Try this:\n```cpp\nfor (int i = 0; i < n; i++) {}\n```");
    expect(await note()).toBeNull();
    expect(await note()).toBeNull(); // the rejected reply is kept empty: counted, and not paid for again
    expect(generate).toHaveBeenCalledTimes(1);
    await db.delete(lessonNotes).where(eq(lessonNotes.userId, attempt.userId));

    await db.insert(lessonNotes).values(Array.from({ length: 20 }, () => ({ userId: attempt.userId, skillId, languageCode: "cpp", bodyMd: "earlier", attemptsSeen: 0 })));
    generate.mockClear();
    expect(await note()).toBeNull(); // 20 live calls today, notes and hints together
    expect(generate).not.toHaveBeenCalled();
  });

  it("makes no call when there's nothing personal to say yet", async () => {
    const attempt = await createAttempt();
    const [{ skillId }] = await db.select({ skillId: exercises.skillId }).from(exercises).where(eq(exercises.id, attempt.exerciseId));
    const res = await request(app).post(`/api/v1/lessons/${skillId}/note`).set("Authorization", await bearerFor(attempt.userId)).expect(200);
    expect(res.body.data.note).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });
});
