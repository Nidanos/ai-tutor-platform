import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { masteryRecords, skillPrerequisites, skills as skillRows } from "../src/infrastructure/database/schema/index.js";
import { getStage } from "../src/modules/m12_scaffolding/services/scaffolding.service.js";
import { addDefaultFadeSchedule, bearerFor, createCourse, createSkill, createUser } from "./helpers.js";

const DAY = 86_400_000;

describe("GET /progress", () => {
  it("shows every skill's reading and writing apart, as they are today, with a status", async () => {
    // basics → loops → arrays (a chain), plus an unrelated skill with no prerequisites; and a forgotten one.
    const course = await createCourse();
    await addDefaultFadeSchedule(course.id);
    const [basics, loops, arrays, solo, old] = await Promise.all(Array.from({ length: 5 }, () => createSkill(course.id)));
    await db.insert(skillPrerequisites).values([
      { skillId: loops.id, prerequisiteId: basics.id },
      { skillId: arrays.id, prerequisiteId: loops.id },
    ]);
    const user = await createUser();
    const record = (skillId: string, values: Partial<typeof masteryRecords.$inferInsert>) => ({ userId: user.id, skillId, languageCode: "cpp", decayLambda: 0.05, ...values });
    await db.insert(masteryRecords).values([
      record(basics.id, { readingScore: 0.9, readingEvidenceAt: new Date(), writingScore: 0.8, writingEvidenceAt: new Date(), clearedAt: new Date(), attemptCount: 6 }),
      record(loops.id, { writingScore: 0.4, writingEvidenceAt: new Date(Date.now() - 10 * DAY), attemptCount: 2 }),
      record(old.id, { writingScore: 0.8, writingEvidenceAt: new Date(Date.now() - 30 * DAY), clearedAt: new Date(), attemptCount: 5 }),
    ]);
    await getStage({ userId: user.id, skillId: loops.id, languageCode: "cpp" }, course.id);

    await db.update(skillRows).set({ description: "Works on its own." }).where(eq(skillRows.id, solo.id));

    const res = await request(app).get(`/api/v1/progress?course=${course.slug}`).set("Authorization", await bearerFor(user.id)).expect(200);
    const { summary, skills } = res.body.data;
    const of = (id: string) => skills.find((s: { skill: { id: string } }) => s.skill.id === id);

    expect(of(basics.id)).toMatchObject({ status: "cleared", reading: { score: 0.9 }, writing: { score: 0.8 } });
    expect(of(loops.id)).toMatchObject({ status: "in_progress", stage: 1, prerequisites: [basics.id] });
    expect(of(loops.id).writing.score).toBe(0.4); // stored, never changed
    expect(of(loops.id).writing.effective).toBeCloseTo(0.4 * Math.exp(-0.05 * 10), 3); // what's left today
    expect(of(arrays.id)).toMatchObject({ status: "locked", reading: { score: 0, effective: 0 }, stage: null });
    expect(of(solo.id)).toMatchObject({ status: "ready", skill: { description: "Works on its own." } });
    expect(of(old.id).status).toBe("review_due"); // cleared, but faded below 0.5
    expect(summary).toEqual({ total: 5, locked: 1, ready: 1, in_progress: 1, cleared: 1, review_due: 1 });
  });

  it("names prerequisites from another course, and holds a skill back until they are met", async () => {
    const [basics, course] = [await createCourse(), await createCourse()];
    const [pointers, lists] = [await createSkill(basics.id), await createSkill(course.id)];
    await db.insert(skillPrerequisites).values({ skillId: lists.id, prerequisiteId: pointers.id });
    const user = await createUser();
    const progress = async () =>
      (await request(app).get(`/api/v1/progress?course=${course.slug}`).set("Authorization", await bearerFor(user.id)).expect(200)).body.data;

    const before = await progress();
    expect(before.skills[0]).toMatchObject({ status: "locked", prerequisites: [pointers.id] });
    expect(before.outside).toEqual([{ skill: { id: pointers.id, slug: pointers.slug, name: pointers.name }, course: { slug: basics.slug }, status: "not_started" }]);

    await db.insert(masteryRecords).values({ userId: user.id, skillId: pointers.id, languageCode: "cpp", decayLambda: 0.05, writingScore: 0.9, writingEvidenceAt: new Date(), clearedAt: new Date() });
    const after = await progress();
    expect(after.skills[0].status).toBe("ready");
    expect(after.outside[0].status).toBe("cleared");
  });

  it("404s for a course that doesn't exist in that language", async () => {
    const user = await createUser();
    await request(app).get("/api/v1/progress?course=no-such-course").set("Authorization", await bearerFor(user.id)).expect(404);
  });
});
