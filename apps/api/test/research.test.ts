import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { consents } from "../src/infrastructure/database/schema/index.js";
import { createUser, PG, pgError } from "./helpers.js";

describe("research schema", () => {
  it("allows one live consent of each kind, and a new one after revoking", async () => {
    const { id: userId } = await createUser();
    const consent = (revokedAt: Date | null = null) =>
      db.insert(consents).values({ userId, kind: "research_study", policyVersion: "v1", revokedAt });
    await consent(new Date()); // an old, revoked consent doesn't block a new one
    await consent();
    await expect(consent()).rejects.toMatchObject(pgError(PG.unique));
  });
});
