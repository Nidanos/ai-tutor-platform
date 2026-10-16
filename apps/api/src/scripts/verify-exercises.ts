import { db } from "../infrastructure/database/index.js";
import { listByStatus } from "../modules/m6_exercises/repositories/exercises.repository.js";
import { verifyExercise } from "../modules/m6_exercises/services/verify-exercise.js";

// Runs every draft exercise in the real sandbox (about 2 runs each) and marks it verified or rejected.
// One at a time: E2B Hobby starts 1 sandbox per second.
const drafts = await listByStatus("draft");
console.log(`Verifying ${drafts.length} draft exercise(s)…`);
let rejected = 0;
for (const { id, title, rung } of drafts) {
  const result = await verifyExercise(id);
  if (!result.ok) rejected++;
  console.log(`${result.ok ? "ok      " : "REJECTED"} rung ${rung} · ${title}${result.ok ? "" : ` → ${result.reason}`}`);
}
console.log(`${drafts.length - rejected} verified, ${rejected} rejected.`);
await db.$client.end();
