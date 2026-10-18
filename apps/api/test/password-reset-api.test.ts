import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { db } from "../src/infrastructure/database/index.js";
import { passwordResetTokens, users } from "../src/infrastructure/database/schema/index.js";
import { sendMail } from "../src/infrastructure/mail/mailer.js";
import { randomToken, sha256 } from "../src/shared/auth/tokens.js";
import { uniq } from "./helpers.js";

vi.mock("../src/infrastructure/mail/mailer.js", () => ({ sendMail: vi.fn(async () => {}) }));
beforeEach(() => vi.mocked(sendMail).mockClear());

const AUTH = "/api/v1/auth";
const OLD_PASSWORD = "correct horse battery";
const NEW_PASSWORD = "a brand new passphrase";

// Each test is its own browser: own IP (for rate limits), own cookie jar, our web origin.
const client = () => request.agent(app).set("X-Forwarded-For", `10.2.${randomInt(256)}.${randomInt(256)}`).set("Origin", env.WEB_ORIGIN);
// "Nothing was sent" can't be awaited: the background job is a query or two, long done after this.
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));
const forgot = (email: string) => client().post(`${AUTH}/forgot-password`).send({ email });
const reset = (token: string, password = NEW_PASSWORD) => client().post(`${AUTH}/reset-password`).send({ token, password });
const userIdOf = async (email: string) => (await db.select({ id: users.id }).from(users).where(eq(users.email, email)))[0].id;

async function register(dateOfBirth = "2000-01-01") {
  const email = `${uniq()}@test.dev`;
  await client().post(`${AUTH}/register`).send({ email, password: OLD_PASSWORD, displayName: "Asha", dateOfBirth, acceptTerms: true, acceptPrivacy: true }).expect(201);
  return email;
}

async function learner() {
  const email = await register();
  const c = client();
  await c.post(`${AUTH}/login`).send({ email, password: OLD_PASSWORD }).expect(204);
  return { c, email };
}

// Asks for a link and returns the token from the email that would have been sent.
async function linkFor(email: string) {
  await forgot(email).expect(202);
  await vi.waitFor(() => expect(sendMail).toHaveBeenCalled());
  const mail = vi.mocked(sendMail).mock.calls.at(-1)![0];
  vi.mocked(sendMail).mockClear();
  return { mail, token: mail.text.match(/#token=([\w-]+)/)![1] };
}

describe("forgot password", () => {
  it("emails a 30-minute link with the token in the #fragment, storing only its hash", async () => {
    const { email } = await learner();
    const { mail, token } = await linkFor(email);
    expect(mail).toMatchObject({ to: email, subject: "Reset your AI-Tutor password" });
    expect(mail.text).toContain(`${env.WEB_ORIGIN}/reset-password#token=`);
    expect(JSON.stringify(mail)).not.toContain("Asha"); // only the address goes to the email provider (privacy policy §5)

    const [stored] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.userId, await userIdOf(email)));
    expect(stored.tokenHash).toBe(sha256(token));
    const minutesLeft = (stored.expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutesLeft).toBeGreaterThan(29);
    expect(minutesLeft).toBeLessThanOrEqual(30);
  });

  it("answers unknown and inactive accounts exactly like a real one, and mails only the real one", async () => {
    const { email } = await learner();
    const minor = await register("2014-01-01"); // waiting for a parent, so not active
    const replies = await Promise.all([email, minor, `${uniq()}@nobody.dev`].map((e) => forgot(e).expect(202)));
    for (const reply of replies) expect(reply.body).toEqual(replies[0].body);

    await vi.waitFor(() => expect(sendMail).toHaveBeenCalled());
    await settle();
    expect(vi.mocked(sendMail).mock.calls.map(([mail]) => mail.to)).toEqual([email]);
  });

  it("sends one email per account every 5 minutes; asking sooner keeps the link already sent", async () => {
    const { email } = await learner();
    const { token } = await linkFor(email);
    await forgot(email).expect(202);
    await settle();
    expect(sendMail).not.toHaveBeenCalled();
    await reset(token).expect(204);
  });

  it("limits each IP to 5 requests per 15 minutes", async () => {
    const c = client();
    for (let i = 0; i < 5; i++) await c.post(`${AUTH}/forgot-password`).send({ email: `${uniq()}@nobody.dev` }).expect(202);
    await c.post(`${AUTH}/forgot-password`).send({ email: `${uniq()}@nobody.dev` }).expect(429);
  });
});

describe("reset password", () => {
  it("sets the new password, ends every login, and works only once", async () => {
    const { c, email } = await learner();
    const { token } = await linkFor(email);
    await reset(token).expect(204);

    await client().post(`${AUTH}/login`).send({ email, password: OLD_PASSWORD }).expect(401);
    await client().post(`${AUTH}/login`).send({ email, password: NEW_PASSWORD }).expect(204);
    await c.post(`${AUTH}/refresh`).expect(401); // the session from before the reset is over

    const again = await reset(token, "yet another one!").expect(400);
    expect(again.body.error.code).toBe("RESET_LINK_INVALID");
  });

  it("lets only one of two simultaneous resets through", async () => {
    const { email } = await learner();
    const { token } = await linkFor(email);
    const replies = await Promise.all([reset(token, "first one!"), reset(token, "second one!")]);
    expect(replies.map((r) => r.status).sort()).toEqual([204, 400]);
  });

  it("refuses an expired link, and an older link once a newer one was sent", async () => {
    const { email } = await learner();
    const userId = await userIdOf(email);
    const first = await linkFor(email);
    await db.update(passwordResetTokens).set({ createdAt: new Date(Date.now() - 6 * 60_000) }).where(eq(passwordResetTokens.userId, userId)); // past the 5-minute gap
    const second = await linkFor(email);
    await reset(first.token).expect(400);

    await db.update(passwordResetTokens).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(passwordResetTokens.userId, userId));
    await reset(second.token).expect(400);
  });

  it("ends the account's other links too (two requests at once can each make one)", async () => {
    const { email } = await learner();
    const { token } = await linkFor(email);
    const other = randomToken();
    await db.insert(passwordResetTokens).values({ userId: await userIdOf(email), tokenHash: sha256(other), expiresAt: new Date(Date.now() + 60_000) });
    await reset(token).expect(204);
    await reset(other).expect(400);
  });

  it("asks for a password of 8 to 128 characters", async () => {
    const { email } = await learner();
    const { token } = await linkFor(email);
    await reset(token, "short").expect(400);
  });
});
