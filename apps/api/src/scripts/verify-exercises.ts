import { setTimeout as sleep } from "node:timers/promises";
import { db } from "../infrastructure/database/index.js";
import { listByStatus } from "../modules/m6_exercises/repositories/exercises.repository.js";
import { verifyExercise } from "../modules/m6_exercises/services/verify-exercise.js";

const TRIES = 3;
const RETRY_WAIT_MS = 5_000;

// A sandbox failure throws and leaves the exercise a draft, so it's tried again, and after the last
// try skipped: the next run picks it up. Only a real verdict marks it verified or rejected.
async function verifyWithRetry(id: string) {
  for (let tryNo = 1; ; tryNo++) {
    try {
      return await verifyExercise(id);
    } catch (err) {
      if (tryNo === TRIES) return { skipped: String(err).slice(0, 200) };
      await sleep(RETRY_WAIT_MS);
    }
  }
}

// Runs every draft exercise in the real sandbox (about 2 runs each) and marks it verified or rejected.
// One at a time: E2B Hobby starts 1 sandbox per second.
const drafts = await listByStatus("draft");
console.log(`Verifying ${drafts.length} draft exercise(s)…`);
let [rejected, skipped] = [0, 0];
for (const { id, title, rung } of drafts) {
  const result = await verifyWithRetry(id);
  if ("skipped" in result) {
    skipped++;
    console.log(`SKIPPED  rung ${rung} · ${title} → ${result.skipped}`);
    continue;
  }
  if (!result.ok) rejected++;
  console.log(`${result.ok ? "ok      " : "REJECTED"} rung ${rung} · ${title}${result.ok ? "" : ` → ${result.reason}`}`);
}
console.log(`${drafts.length - rejected - skipped} verified, ${rejected} rejected, ${skipped} skipped (still drafts: run again).`);
await db.$client.end();
if (skipped) process.exitCode = 1;
