import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { db } from "../src/infrastructure/database/index.js";
import { consents, refreshTokens, users } from "../src/infrastructure/database/schema/index.js";
import { ageOn } from "../src/modules/m1_auth/services/age.js";
import { sha256 } from "../src/shared/auth/tokens.js";
import { vercelVisitor } from "../src/shared/middlewares/vercel-visitor.js";
import { uniq } from "./helpers.js";

const AUTH = "/api/v1/auth";
const PASSWORD = "correct horse battery";

// Each test is its own browser: own IP (for rate limits), own cookie jar, our web origin.
const client = () =>
  request.agent(app).set("X-Forwarded-For", `10.0.${randomInt(256)}.${randomInt(256)}`).set("Origin", env.WEB_ORIGIN);

const yearsAgo = (years: number) => `${new Date().getUTCFullYear() - years}-01-01`;
const newAccount = (age = 30) => ({
  email: `${uniq()}@test.dev`,
  password: PASSWORD,
  displayName: "Tester",
  dateOfBirth: yearsAgo(age),
  acceptTerms: true,
  acceptPrivacy: true,
});
const consentKindsOf = async (userId: string) =>
  (await db.select({ kind: consents.kind }).from(consents).where(eq(consents.userId, userId))).map((c) => c.kind).sort();

async function registerAndLogin() {
  const c = client();
  const account = newAccount();
  await c.post(`${AUTH}/register`).send(account).expect(201);
  await c.post(`${AUTH}/login`).send({ email: account.email, password: PASSWORD }).expect(204);
  return { c, account };
}

async function mobileLogin() {
  const c = client();
  const account = newAccount();
  await c.post(`${AUTH}/register`).send(account).expect(201);
  const res = await c.post(`${AUTH}/login`).send({ email: account.email, password: PASSWORD, client: "mobile" });
  return { c, tokens: res.body.data };
}

describe("auth", () => {
  it("registers, logs in with cookies, and returns the profile without secrets", async () => {
    const { c, account } = await registerAndLogin();
    const res = await c.get(`${AUTH}/me`).expect(200);
    expect(res.body.data.user).toMatchObject({ email: account.email, role: "LEARNER" });
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);
  });

  it("ignores a role sent at sign-up", async () => {
    const res = await client().post(`${AUTH}/register`).send({ ...newAccount(), role: "ADMIN" }).expect(201);
    expect(res.body.data.user.role).toBe("LEARNER");
  });

  it("rejects the same email in any letter case with 409", async () => {
    const c = client();
    const account = newAccount();
    await c.post(`${AUTH}/register`).send(account).expect(201);
    const res = await c.post(`${AUTH}/register`).send({ ...account, email: account.email.toUpperCase() }).expect(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("answers a wrong password and an unknown email identically", async () => {
    const { account } = await registerAndLogin();
    const login = (email: string, password: string) => client().post(`${AUTH}/login`).send({ email, password }).expect(401);
    const wrongPassword = await login(account.email, "wrong password");
    const unknownEmail = await login(`${uniq()}@test.dev`, PASSWORD);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it("rotates refresh tokens, and revokes the whole login when an old one is reused", async () => {
    const { c, tokens: first } = await mobileLogin();
    const refresh = (refreshToken: string) => c.post(`${AUTH}/refresh`).send({ refreshToken });
    const second = (await refresh(first.refreshToken).expect(200)).body.data;
    await c.get(`${AUTH}/me`).set("Authorization", `Bearer ${second.accessToken}`).expect(200);

    await refresh(first.refreshToken).expect(200); // two tabs at once: allowed inside the grace window
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(Date.now() - 60_000) })
      .where(eq(refreshTokens.tokenHash, sha256(first.refreshToken)));
    await refresh(first.refreshToken).expect(401); // after it, reuse means theft...
    await refresh(second.refreshToken).expect(401); // ...so every token of that login dies
  });

  it("ends the session on logout", async () => {
    const { c, tokens } = await mobileLogin();
    await c.post(`${AUTH}/logout`).send({ refreshToken: tokens.refreshToken }).expect(204);
    await c.post(`${AUTH}/refresh`).send({ refreshToken: tokens.refreshToken }).expect(401);
  });

  it("blocks cookie-carrying writes from another site", async () => {
    const { c } = await registerAndLogin();
    await c.post(`${AUTH}/logout`).set("Origin", "https://evil.example").expect(403);
  });

  it("accepts cookie-carrying writes from the team's local web app", async () => {
    const { c } = await registerAndLogin();
    await c.post(`${AUTH}/logout`).set("Origin", env.DEV_WEB_ORIGIN!).expect(204);
  });

  it("throttles the 6th failed login for one email", async () => {
    const { account } = await registerAndLogin();
    const attempt = () => client().post(`${AUTH}/login`).send({ email: account.email, password: "wrong password" });
    for (let i = 0; i < 5; i++) await attempt().expect(401);
    await attempt().expect(429);
  });

  it("counts a too-long email by its first 254 characters, so junk can't grow the limiter's memory", async () => {
    const junk = `${uniq()}${"x".repeat(300)}`;
    const attempt = (n: number) => client().post(`${AUTH}/login`).send({ email: `${junk}${n}@test.dev`, password: "wrong password" });
    for (let i = 0; i < 5; i++) await attempt(i).expect(400);
    await attempt(5).expect(429);
  });

  it("answers 400, not 500, when the email isn't a string", async () => {
    // String() throws on this object, so it must not reach the limiter's key unchecked.
    await client().post(`${AUTH}/login`).send({ email: { toString: 1 }, password: PASSWORD }).expect(400);
  });
});

describe("client IP for the per-IP limits", () => {
  // req.ip, the limiters' key, for a request claiming X-Forwarded-For 6.6.6.6, by who connected to us.
  const ipFrom = (peer: string) =>
    Object.create(app.request, { socket: { value: { remoteAddress: peer } }, headers: { value: { "x-forwarded-for": "6.6.6.6" } } }).ip;

  it("comes from our own proxy, never from a caller on the internet", () => {
    expect(ipFrom("172.18.0.2")).toBe("6.6.6.6"); // Caddy on the Docker network
    expect(ipFrom("203.0.113.9")).toBe("203.0.113.9"); // a direct caller can't choose its IP
  });

  it("is Vercel's visitor only with our secret, behind Render's proxy (ADR-0024)", () => {
    // Render's proxy (private address) has appended Vercel's address after the visitor's.
    const viaRender = (headers: Record<string, string>) => {
      const req = Object.create(app.request, { socket: { value: { remoteAddress: "10.201.3.4" } }, headers: { value: { ...headers } } });
      vercelVisitor(req, {} as Response, () => {});
      return req as Request;
    };
    const chain = { "x-forwarded-for": "6.6.6.6, 76.76.21.9" };
    const signed = viaRender({ ...chain, "x-origin-secret": env.ORIGIN_SECRET! });
    expect(signed.ip).toBe("6.6.6.6");
    expect(signed.headers["x-origin-secret"]).toBeUndefined(); // never passed further in
    expect(viaRender({ ...chain, "x-origin-secret": "a-wrong-secret-of-the-same-sort-0000" }).ip).toBe("76.76.21.9");
    expect(viaRender(chain).ip).toBe("76.76.21.9"); // without it, the first entry could be made up
  });
});

describe("consent at sign-up", () => {
  const register = (body: object) => client().post(`${AUTH}/register`).send(body);

  it("records the required consents plus only the opt-ins chosen", async () => {
    const res = await register({ ...newAccount(), aiTraining: true }).expect(201);
    expect(await consentKindsOf(res.body.data.user.id)).toEqual(["ai_training", "data_processing", "terms"]);
  });

  it("refuses sign-up without accepting the Terms", async () => {
    const res = await register({ ...newAccount(), acceptTerms: false }).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("refuses a date of birth in the future", async () => {
    await register({ ...newAccount(), dateOfBirth: yearsAgo(-1) }).expect(400);
  });

  it("refuses under-18s during the pilot, next to the date of birth, and saves nothing", async () => {
    const account = { ...newAccount(17), research: true };
    const res = await register(account).expect(400);
    expect(res.body.error.details).toEqual([expect.objectContaining({ path: ["dateOfBirth"], message: "AI-Tutor is open to adults (18 and over) for now" })]);
    expect(await db.$count(users, eq(users.email, account.email))).toBe(0);
  });

  it("still keeps an account waiting for a parent from logging in", async () => {
    const account = newAccount();
    const res = await register(account).expect(201);
    await db.update(users).set({ status: "pending_parent" }).where(eq(users.id, res.body.data.user.id));
    const login = await client().post(`${AUTH}/login`).send({ email: account.email, password: PASSWORD }).expect(403);
    expect(login.body.error.code).toBe("PARENT_APPROVAL_PENDING");
  });

  it("counts age in whole years, turning 18 on the birthday", () => {
    expect(ageOn("2008-10-15", new Date("2026-10-14"))).toBe(17);
    expect(ageOn("2008-10-15", new Date("2026-10-15"))).toBe(18);
  });
});
