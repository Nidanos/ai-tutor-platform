import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { db } from "../src/infrastructure/database/index.js";
import { refreshTokens } from "../src/infrastructure/database/schema/index.js";
import { sha256 } from "../src/shared/auth/tokens.js";
import { uniq } from "./helpers.js";

const AUTH = "/api/v1/auth";
const PASSWORD = "correct horse battery";

// Each test is its own browser: own IP (for rate limits), own cookie jar, our web origin.
const client = () =>
  request.agent(app).set("X-Forwarded-For", `10.0.${randomInt(256)}.${randomInt(256)}`).set("Origin", env.WEB_ORIGIN);

const newAccount = () => ({ email: `${uniq()}@test.dev`, password: PASSWORD, displayName: "Tester" });

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

  it("throttles the 6th failed login for one email", async () => {
    const { account } = await registerAndLogin();
    const attempt = () => client().post(`${AUTH}/login`).send({ email: account.email, password: "wrong password" });
    for (let i = 0; i < 5; i++) await attempt().expect(401);
    await attempt().expect(429);
  });
});
