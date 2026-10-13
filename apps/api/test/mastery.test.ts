import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { diagnosticAttempts, evidenceEvents } from "../src/infrastructure/database/schema/index.js";
import { createEnrollment, createSkill, PG, pgError } from "./helpers.js";

// A learner, a skill of their course, and a diagnostic to use as an evidence source.
async function setup() {
  const enrollment = await createEnrollment();
  const skill = await createSkill(enrollment.courseId);
  const [diagnostic] = await db
    .insert(diagnosticAttempts)
    .values({ enrollmentId: enrollment.id, attemptNo: 1 })
    .returning();
  const evidence = (diagnosticId: string | null) => ({
    userId: enrollment.userId,
    skillId: skill.id,
    languageCode: "cpp",
    dimension: "reading" as const,
    diagnosticId,
    weight: 1,
    scoreBefore: 0,
    scoreAfter: 0.4,
    formulaVersion: "v1",
  });
  return { diagnostic, evidence };
}

describe("mastery schema", () => {
  it("rejects evidence that has no source", async () => {
    const { evidence } = await setup();
    await expect(db.insert(evidenceEvents).values(evidence(null))).rejects.toMatchObject(pgError(PG.check));
  });

  it("never counts the same evidence twice", async () => {
    const { diagnostic, evidence } = await setup();
    await db.insert(evidenceEvents).values(evidence(diagnostic.id));
    await expect(db.insert(evidenceEvents).values(evidence(diagnostic.id))).rejects.toMatchObject(pgError(PG.unique));
  });
});
