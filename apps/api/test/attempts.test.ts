import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db } from "../src/infrastructure/database/index.js";
import { exerciseAttempts, submissions } from "../src/infrastructure/database/schema/index.js";
import { createAttempt, PG, pgError, uniq } from "./helpers.js";

describe("attempts schema", () => {
  it("rejects a double-submit with the same idempotency key", async () => {
    const attempt = await createAttempt();
    const key = uniq();
    const submit = () =>
      db.insert(submissions).values({
        attemptId: attempt.id,
        userId: attempt.userId,
        exerciseId: attempt.exerciseId,
        languageCode: "cpp",
        answer: "int main() {}",
        answerSha256: "x",
        idempotencyKey: key,
      });
    await submit();
    await expect(submit()).rejects.toMatchObject(pgError(PG.unique));
  });

  it("never lets the hint level pass the fade ceiling", async () => {
    const attempt = await createAttempt(); // ceiling 3
    const setLevel = (hintLevel: number) =>
      db.update(exerciseAttempts).set({ hintLevel }).where(eq(exerciseAttempts.id, attempt.id));
    await setLevel(3);
    await expect(setLevel(4)).rejects.toMatchObject(pgError(PG.check));
  });
});
