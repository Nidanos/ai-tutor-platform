import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { courseLanguages, courses, generationJobs, users } from "../src/infrastructure/database/schema/index.js";
import { geminiReady } from "../src/infrastructure/llm/gemini-provider.js";
import { enqueueGeneration } from "../src/infrastructure/queue/generation-queue.js";
import { queueMissingExercise } from "../src/modules/m6_exercises/services/request-generation.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser } from "./helpers.js";

// No Redis and no Gemini here: the queue is checked, not run; "billing on" is pretended per test.
vi.mock("../src/infrastructure/queue/generation-queue.js", () => ({ enqueueGeneration: vi.fn() }));
vi.mock("../src/infrastructure/llm/gemini-provider.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/infrastructure/llm/gemini-provider.js")>()),
  geminiReady: vi.fn(() => true),
}));

beforeEach(() => vi.mocked(enqueueGeneration).mockClear());

async function authorInCourse() {
  const course = await createCourse();
  await addDefaultFadeSchedule(course.id);
  const skill = await createSkill(course.id);
  const author = await createUser();
  await db.update(users).set({ role: "AUTHOR" }).where(eq(users.id, author.id));
  const auth = await bearerFor(author.id);
  const generate = async (body: object, status = 202) =>
    (await request(app).post("/api/v1/exercises/generate").set("Authorization", auth).send({ course: course.slug, ...body }).expect(status)).body;
  return { course, skill, auth, generate };
}

describe("POST /exercises/generate", () => {
  it("queues one job per skill and rung for an author, and returns the same job while it runs", async () => {
    const t = await authorInCourse();
    const { job } = (await t.generate({ skill: t.skill.slug, rung: 2 })).data;
    expect(job).toMatchObject({ status: "queued", trigger: "pregen", rung: 2, tries: 0, skill: { slug: t.skill.slug }, failures: [] });
    expect(enqueueGeneration).toHaveBeenCalledWith(job.id);
    expect((await t.generate({ skill: t.skill.slug, rung: 2 })).data.job.id).toBe(job.id);

    const status = await request(app).get(`/api/v1/exercises/generation/${job.id}`).set("Authorization", t.auth).expect(200);
    expect(status.body.data.job).toMatchObject({ id: job.id, status: "queued" });
  });

  it("is for admins and authors only, and refuses while billing is off", async () => {
    const t = await authorInCourse();
    const learner = await bearerFor((await createUser()).id);
    await request(app).post("/api/v1/exercises/generate").set("Authorization", learner).send({ course: t.course.slug, skill: t.skill.slug, rung: 1 }).expect(403);

    vi.mocked(geminiReady).mockReturnValueOnce(false);
    expect((await t.generate({ skill: t.skill.slug, rung: 1 }, 503)).error.code).toBe("GENERATION_UNAVAILABLE");
  });

  it("leaves DSA hand-written: no job on request or for a skill with nothing to serve (ADR-0023)", async () => {
    await db.insert(courses).values({ slug: "dsa", title: "DSA" }).onConflictDoNothing();
    const [dsa] = await db.select().from(courses).where(eq(courses.slug, "dsa"));
    await db.insert(courseLanguages).values({ courseId: dsa.id, languageCode: "cpp", isDefault: true }).onConflictDoNothing();
    const skill = await createSkill(dsa.id);
    const t = await authorInCourse();
    const res = await request(app).post("/api/v1/exercises/generate").set("Authorization", t.auth).send({ course: "dsa", skill: skill.slug, rung: 4 }).expect(422);
    expect(res.body.error.code).toBe("GENERATION_NOT_COVERED");

    await queueMissingExercise({ skillId: skill.id, languageCode: "cpp", rung: 4 });
    expect(await db.select().from(generationJobs).where(eq(generationJobs.skillId, skill.id))).toEqual([]);
    expect(enqueueGeneration).not.toHaveBeenCalled();
  });

  it("404s for an unknown skill or job", async () => {
    const t = await authorInCourse();
    expect((await t.generate({ skill: "no-such-skill", rung: 1 }, 404)).error.code).toBe("SKILL_NOT_FOUND");
    const res = await request(app).get(`/api/v1/exercises/generation/${randomUUID()}`).set("Authorization", t.auth).expect(404);
    expect(res.body.error.code).toBe("GENERATION_JOB_NOT_FOUND");
  });
});

describe("automatic generation", () => {
  it("queues an exercise when the learner's next skill has none, once", async () => {
    const t = await authorInCourse(); // a course whose only skill has no exercises
    const learner = await bearerFor((await createUser()).id);
    const next = async () =>
      (await request(app).get(`/api/v1/recommendations/next?course=${t.course.slug}`).set("Authorization", learner).expect(200)).body.data.recommendation;

    expect(await next()).toMatchObject({ skill: { id: t.skill.id }, exerciseId: null });
    await next();
    const jobs = await db.select().from(generationJobs).where(eq(generationJobs.skillId, t.skill.id));
    expect(jobs).toEqual([expect.objectContaining({ rung: 1, trigger: "on_demand", status: "queued" })]);
    expect(enqueueGeneration).toHaveBeenCalledWith(jobs[0].id);
  });
});
