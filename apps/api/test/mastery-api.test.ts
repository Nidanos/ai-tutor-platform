import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/infrastructure/database/index.js";
import { masteryRecords } from "../src/infrastructure/database/schema/index.js";
import { bearerFor, createCourse, createSkill, createUser } from "./helpers.js";

const DAY_MS = 86_400_000;

// A learner with writing 0.6, last evidence 14 days ago, on a skill that loses 5% a day.
async function learnerWithMastery() {
  const [user, skill] = [await createUser(), await createSkill((await createCourse()).id)];
  await db.insert(masteryRecords).values({
    userId: user.id,
    skillId: skill.id,
    languageCode: "cpp",
    writingScore: 0.6,
    writingEvidenceAt: new Date(Date.now() - 14 * DAY_MS),
    decayLambda: 0.05,
    attemptCount: 3,
    successCount: 2,
  });
  // Resolves to the response once the status matched.
  const get = async (path: string, status = 200) =>
    request(app).get(`/api/v1/mastery${path}`).set("Authorization", await bearerFor(user.id)).expect(status);
  return { skill, get };
}

describe("mastery API", () => {
  it("lists skills with reading and writing apart, decayed on read", async () => {
    const { skill, get } = await learnerWithMastery();
    const [row] = (await get("")).body.data.skills;
    expect(row.skill).toMatchObject({ id: skill.id, name: "Test" });
    expect(row.writing.score).toBe(0.6); // what is stored never decays...
    expect(row.writing.effective).toBeCloseTo(0.6 * Math.exp(-0.05 * 14), 3); // ...what is shown does
    expect(row.reading).toMatchObject({ score: 0, effective: 0, lastEvidenceAt: null });
  });

  it("shows one skill in detail, and zeros for a skill never practised", async () => {
    const { skill, get } = await learnerWithMastery();
    const detail = (await get(`/${skill.id}`)).body.data;
    expect(detail).toMatchObject({ languageCode: "cpp", attemptCount: 3, successCount: 2, history: [] });

    const untouched = await createSkill((await createCourse()).id);
    const empty = (await get(`/${untouched.id}`)).body.data;
    expect(empty).toMatchObject({ attemptCount: 0, writing: { effective: 0 }, history: [] });
  });

  it("answers 404 for a skill that doesn't exist", async () => {
    const { get } = await learnerWithMastery();
    const res = await get("/00000000-0000-7000-8000-000000000000", 404);
    expect(res.body.error.code).toBe("SKILL_NOT_FOUND");
  });
});
