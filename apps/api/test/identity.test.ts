import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { refreshTokens, users } from "../src/infrastructure/database/schema/index.js";
import { createUser, PG, pgError, uniq } from "./helpers.js";

describe("identity schema", () => {
  it("treats email as unique and case-insensitive", async () => {
    const email = `${uniq()}@test.dev`;
    await createUser(email);
    await expect(createUser(email.toUpperCase())).rejects.toMatchObject(pgError(PG.unique));
  });

  it("deletes a user's refresh tokens with the user", async () => {
    const user = await createUser();
    await db.insert(refreshTokens).values({
      userId: user.id,
      familyId: crypto.randomUUID(),
      tokenHash: uniq(),
      client: "web",
      expiresAt: new Date(),
    });
    await db.delete(users).where(eq(users.id, user.id));
    expect(await db.select().from(refreshTokens).where(eq(refreshTokens.userId, user.id))).toHaveLength(0);
  });
});
