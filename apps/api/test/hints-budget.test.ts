import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { exercises, exerciseSecrets, exerciseTests } from "../src/infrastructure/database/schema/index.js";
import { geminiProvider } from "../src/infrastructure/llm/gemini-provider.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser, exerciseRow } from "./helpers.js";

// Its own file: here the month's budget is already spent, for every test in it.
vi.mock("../src/infrastructure/llm/gemini-provider.js", () => ({ geminiProvider: { generate: vi.fn() } }));
vi.mock("../src/infrastructure/llm/llm-log.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/infrastructure/llm/llm-log.js")>()),
  spentThisMonthInr: async () => 500,
}));

describe("hint budget", () => {
  it("serves frozen hints without calling the tutor once ₹500 is spent this month", async () => {
    const course = await createCourse();
    await addDefaultFadeSchedule(course.id);
    const [exercise] = await db.insert(exercises).values({ ...exerciseRow((await createSkill(course.id)).id), status: "verified" }).returning();
    await db.insert(exerciseSecrets).values({ exerciseId: exercise.id, harnessCode: "h", referenceSolution: "int f() { return 1; }" });
    await db.insert(exerciseTests).values({ exerciseId: exercise.id, seq: 1, name: "Example", size: "small", visibility: "sample", expectedOutput: "1" });
    const auth = await bearerFor((await createUser()).id);
    await request(app).get(`/api/v1/exercises/${exercise.id}`).set("Authorization", auth).expect(200);

    const res = await request(app).post(`/api/v1/exercises/${exercise.id}/hints`).set("Authorization", auth).send({}).expect(200);
    expect(res.body.data.hint).toMatchObject({ level: 1, source: "generic" });
    expect(geminiProvider.generate).not.toHaveBeenCalled();
  });
});
