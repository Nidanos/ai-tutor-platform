import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { learningSessions, sessionSteps } from "../src/infrastructure/database/schema/index.js";
import { createEnrollment, PG, pgError } from "./helpers.js";

const openSession = async () => {
  const { id, userId } = await createEnrollment();
  const start = () => db.insert(learningSessions).values({ userId, enrollmentId: id }).returning();
  return { start, session: (await start())[0] };
};

describe("sessions schema", () => {
  it("allows only one open session per learner", async () => {
    const { start } = await openSession();
    await expect(start()).rejects.toMatchObject(pgError(PG.unique));
  });

  it("allows only one active step per session", async () => {
    const { session } = await openSession();
    const step = (seq: number) =>
      db.insert(sessionSteps).values({ sessionId: session.id, seq, kind: "exercise", status: "active" });
    await step(1);
    await expect(step(2)).rejects.toMatchObject(pgError(PG.unique));
  });
});
