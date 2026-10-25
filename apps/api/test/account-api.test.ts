import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { db } from "../src/infrastructure/database/index.js";
import { sendMail } from "../src/infrastructure/mail/mailer.js";
import { consents, organizations, users } from "../src/infrastructure/database/schema/index.js";
import { bearerFor, createLearnerWithHistory, createUser, LEARNER_CODE, uniq } from "./helpers.js";

vi.mock("../src/infrastructure/mail/mailer.js", () => ({ sendMail: vi.fn(async () => {}) }));
beforeEach(() => vi.mocked(sendMail).mockClear());

const PASSWORD = "correct horse battery";

// Each browser has its own IP (for rate limits) and cookie jar, and comes from our web origin.
const browser = () => request.agent(app).set("X-Forwarded-For", `10.3.${randomInt(256)}.${randomInt(256)}`).set("Origin", env.WEB_ORIGIN);

// A new adult learner, logged in.
async function learner() {
  const email = `${uniq()}@test.dev`;
  const c = browser();
  await c.post("/api/v1/auth/register").send({ email, password: PASSWORD, displayName: "Asha", dateOfBirth: "2000-01-01", acceptTerms: true, acceptPrivacy: true }).expect(201);
  await c.post("/api/v1/auth/login").send({ email, password: PASSWORD }).expect(204);
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return { c, user };
}

const kinds = async (c: Awaited<ReturnType<typeof learner>>["c"]) =>
  (await c.get("/api/v1/me/consents").expect(200)).body.data.consents.map((k: { kind: string }) => k.kind).sort();

describe("PATCH /me", () => {
  it("corrects the name and time zone, and renames the hidden personal organisation with the name", async () => {
    const { c, user } = await learner();
    const res = await c.patch("/api/v1/me").send({ displayName: "  Asha K  ", timezone: "Europe/London" }).expect(200);
    expect(res.body.data.user).toMatchObject({ id: user.id, displayName: "Asha K", timezone: "Europe/London", email: user.email });
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    const [org] = await db.select().from(organizations).where(eq(organizations.id, user.orgId));
    expect(org.name).toBe("Asha K");

    await c.patch("/api/v1/me").send({ timezone: "Asia/Kolkata" }).expect(200);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    expect([after.displayName, after.timezone]).toEqual(["Asha K", "Asia/Kolkata"]);
  });

  it("rejects an unknown time zone, a blank name, an empty body and other fields", async () => {
    const { c, user } = await learner();
    for (const body of [{ timezone: "Mars/Olympus" }, { displayName: "   " }, {}, { email: "new@test.dev" }]) {
      expect((await c.patch("/api/v1/me").send(body).expect(400)).body.error.code).toBe("VALIDATION_ERROR");
    }
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    expect([after.email, after.displayName]).toEqual([user.email, "Asha"]);
  });

  it("needs a login, and an account that can still log in", async () => {
    await request(app).patch("/api/v1/me").send({ displayName: "X" }).expect(401);
    const user = await createUser();
    await db.update(users).set({ status: "disabled" }).where(eq(users.id, user.id));
    await request(app).patch("/api/v1/me").set("Authorization", await bearerFor(user.id)).send({ displayName: "X" }).expect(401);
  });
});

describe("opt-ins", () => {
  it("turns AI training and research on and off, keeping every grant as proof", async () => {
    const { c, user } = await learner();
    expect(await kinds(c)).toEqual(["data_processing", "terms"]);

    await c.put("/api/v1/me/consents/ai_training").expect(204);
    await c.put("/api/v1/me/consents/ai_training").expect(204); // already on: nothing changes
    await c.put("/api/v1/me/consents/research_study").expect(204);
    const live = (await c.get("/api/v1/me/consents").expect(200)).body.data.consents;
    expect(live.find((k: { kind: string }) => k.kind === "ai_training")).toMatchObject({ policyVersion: "0.1" });

    await c.delete("/api/v1/me/consents/ai_training").expect(204);
    await c.delete("/api/v1/me/consents/ai_training").expect(204); // already off
    expect(await kinds(c)).toEqual(["data_processing", "research_study", "terms"]);
    await c.put("/api/v1/me/consents/ai_training").expect(204);

    const rows = await db.select().from(consents).where(and(eq(consents.userId, user.id), eq(consents.kind, "ai_training")));
    expect(rows.map((r) => r.revokedAt === null).sort()).toEqual([false, true]); // the first grant, revoked; the new one
  });

  it("is for adults only", async () => {
    for (const dateOfBirth of [new Date(Date.now() - 10 * 365 * 86_400_000).toISOString().slice(0, 10), null]) {
      const user = await createUser(); // e.g. a minor a parent approved, or an account from before birth dates
      await db.update(users).set({ dateOfBirth }).where(eq(users.id, user.id));
      const res = await request(app).put("/api/v1/me/consents/research_study").set("Authorization", await bearerFor(user.id)).expect(403);
      expect(res.body.error.code).toBe("ADULTS_ONLY");
    }
  });

  it("allows 30 switches an hour", async () => {
    const { c } = await learner();
    for (let i = 0; i < 15; i++) {
      await c.put("/api/v1/me/consents/research_study").expect(204);
      await c.delete("/api/v1/me/consents/research_study").expect(204);
    }
    expect((await c.put("/api/v1/me/consents/research_study").expect(429)).body.error.code).toBe("RATE_LIMITED");
  });

  it("won't switch off a consent the account needs, or a kind that doesn't exist", async () => {
    const { c } = await learner();
    for (const kind of ["terms", "data_processing", "parental", "marketing"]) {
      expect((await c.delete(`/api/v1/me/consents/${kind}`).expect(400)).body.error.code).toBe("VALIDATION_ERROR");
    }
    expect(await kinds(c)).toEqual(["data_processing", "terms"]);
  });
});

describe("GET /me/data", () => {
  it("downloads everything held about the learner, from every module, with who it was shared with", async () => {
    const { userId } = await createLearnerWithHistory();
    await createLearnerWithHistory(); // someone else's rows must stay out
    const res = await request(app).get("/api/v1/me/data").set("Authorization", await bearerFor(userId)).expect(200);
    expect(res.headers["content-disposition"]).toBe("attachment; filename=ai-tutor-my-data.json");
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.text).not.toMatch(/hash|"success"/i); // no password or token hashes, and a plain file, not an API envelope

    const data = JSON.parse(res.text);
    expect(data.about.sharedWith.map((p: { provider: string }) => p.provider.split(" ")[0])).toEqual(["Supabase", "Render", "Vercel", "E2B", "Google", "Brevo"]);
    expect(data.account.profile).toMatchObject({ id: userId, displayName: "Test" });
    expect(data.courses).toEqual([expect.objectContaining({ goalText: "Pass my placement interview" })]);
    expect(data.practice.submissions).toEqual([expect.objectContaining({ answer: LEARNER_CODE })]);
    const counts = {
      attempts: data.practice.attempts.length,
      hints: data.hints.length,
      lessonNotes: data.lessonNotes.length,
      placementTests: data.placementTests.tests.length,
      placementAnswers: data.placementTests.answers.length,
      estimates: data.placementTests.estimates.length,
      masteryScores: data.mastery.skills.length,
      evidence: data.mastery.evidence.length,
      recommendations: data.recommendations.length,
      sessions: data.sessions.sessions.length,
      steps: data.sessions.steps.length,
      stages: data.scaffolding.stages.length,
      stageMoves: data.scaffolding.moves.length,
      calibration: data.calibration.length,
    };
    expect(counts).toEqual({ attempts: 1, hints: 1, lessonNotes: 1, placementTests: 1, placementAnswers: 2, estimates: 1, masteryScores: 1, evidence: 1, recommendations: 1, sessions: 1, steps: 1, stages: 1, stageMoves: 2, calibration: 1 });
  });

  it("lists sign-ins and consents, and allows 5 downloads an hour", async () => {
    const { c } = await learner();
    await c.put("/api/v1/me/consents/research_study").expect(204);
    await c.delete("/api/v1/me/consents/research_study").expect(204);
    const data = JSON.parse((await c.get("/api/v1/me/data").expect(200)).text);
    expect(data.account.logins).toEqual([expect.objectContaining({ client: "web", revokedAt: null })]);
    expect(data.account.consents).toHaveLength(3); // withdrawn ones too
    expect(data.account.consents.find((k: { kind: string }) => k.kind === "research_study").revokedAt).not.toBeNull();

    for (let i = 0; i < 4; i++) await c.get("/api/v1/me/data").expect(200);
    expect((await c.get("/api/v1/me/data").expect(429)).body.error.code).toBe("RATE_LIMITED");
    await request(app).get("/api/v1/me/data").set("Authorization", await bearerFor((await createUser()).id)).expect(200); // per learner
  });

  it("needs a login", async () => {
    await request(app).get("/api/v1/me/data").expect(401);
  });
});

describe("DELETE /me", () => {
  it("needs the password again, then ends every login and emails when the account goes", async () => {
    const { c, user } = await learner();
    const phone = browser();
    await phone.post("/api/v1/auth/login").send({ email: user.email, password: PASSWORD }).expect(204);

    expect((await c.delete("/api/v1/me").send({ password: "not my password" }).expect(403)).body.error.code).toBe("WRONG_PASSWORD");
    const res = await c.delete("/api/v1/me").send({ password: PASSWORD }).expect(202);
    expect((new Date(res.body.data.eraseAfter).getTime() - Date.now()) / 86_400_000).toBeCloseTo(7, 2);
    await c.get("/api/v1/auth/me").expect(401); // this browser's cookies are cleared
    await phone.post("/api/v1/auth/refresh").expect(401); // and every other login has ended

    const mail = vi.mocked(sendMail).mock.calls.at(-1)![0];
    expect(mail).toMatchObject({ to: user.email, subject: "Your AI-Tutor account will be deleted" });
    expect(mail.text).toContain(`${env.WEB_ORIGIN}/login`);
    expect(mail.text).toMatch(/after \d+ \w+ \d{4} at .+ IST/); // in the learner's time zone, named
    expect(JSON.stringify(mail)).not.toContain("Asha"); // only the address goes to the email provider
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    expect(after).toMatchObject({ status: "active", email: user.email });
    expect(after.deletionRequestedAt).not.toBeNull();
  });

  it("ends even a login refreshed seconds before, and every token until the next login", async () => {
    const { c, user } = await learner();
    const mobile = (await browser().post("/api/v1/auth/login").send({ email: user.email, password: PASSWORD, client: "mobile" }).expect(200)).body.data;
    const rotated = (await browser().post("/api/v1/auth/refresh").send({ refreshToken: mobile.refreshToken }).expect(200)).body.data;
    await c.delete("/api/v1/me").send({ password: PASSWORD }).expect(202);

    for (const refreshToken of [mobile.refreshToken, rotated.refreshToken]) { // the first is still in its 20 s grace
      await browser().post("/api/v1/auth/refresh").send({ refreshToken }).expect(401);
    }
    await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${rotated.accessToken}`).expect(401);
    await request(app).get("/api/v1/me/data").set("Authorization", `Bearer ${rotated.accessToken}`).expect(401);
  });

  it("is cancelled by logging in again", async () => {
    const { c, user } = await learner();
    await c.delete("/api/v1/me").send({ password: PASSWORD }).expect(202);
    await c.post("/api/v1/auth/login").send({ email: user.email, password: PASSWORD }).expect(204);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    expect(after.deletionRequestedAt).toBeNull();
  });

  it("keeps the address erased accounts get for them alone", async () => {
    const res = await browser()
      .post("/api/v1/auth/register")
      .send({ email: `deleted-${crypto.randomUUID()}@deleted.invalid`, password: PASSWORD, displayName: "X", dateOfBirth: "2000-01-01", acceptTerms: true, acceptPrivacy: true })
      .expect(400);
    expect(res.body.error.details[0].message).toBe("Enter a real email address");
  });

  it("allows 5 password tries in 15 minutes", async () => {
    const { c } = await learner();
    for (let i = 0; i < 5; i++) await c.delete("/api/v1/me").send({ password: "not my password" }).expect(403);
    expect((await c.delete("/api/v1/me").send({ password: PASSWORD }).expect(429)).body.error.code).toBe("RATE_LIMITED");
    expect(sendMail).not.toHaveBeenCalled();
  });
});
