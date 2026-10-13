import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { diagnosticAttempts } from "../src/infrastructure/database/schema/index.js";
import { createEnrollment, PG, pgError } from "./helpers.js";

describe("diagnostic schema", () => {
  it("allows only one diagnostic in progress per enrollment", async () => {
    const { id: enrollmentId } = await createEnrollment();
    await db.insert(diagnosticAttempts).values({ enrollmentId, attemptNo: 1 });
    const retakeWhileOpen = db.insert(diagnosticAttempts).values({ enrollmentId, attemptNo: 2 });
    await expect(retakeWhileOpen).rejects.toMatchObject(pgError(PG.unique));
  });
});
