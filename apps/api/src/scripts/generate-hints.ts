import { db } from "../infrastructure/database/index.js";
import { geminiProvider } from "../infrastructure/llm/gemini-provider.js";
import { listPracticeIds } from "../modules/m6_exercises/services/exercises.service.js";
import { freezeHints } from "../modules/m8_socratic/services/freeze-hints.js";

// Writes and freezes hints 1–4 for every verified practice exercise that has none yet (ADR-0005).
// Safe to re-run: exercises that already have hints are skipped. Costs a few rupees for 25 exercises.
const ids = await listPracticeIds();
console.log(`Hints for ${ids.length} practice exercise(s)…`);
const counts = { frozen: 0, skipped: 0, already: 0 };
for (const id of ids) {
  try {
    const result = await freezeHints(id, geminiProvider);
    counts[result.status]++;
    if (result.status === "skipped") console.log(`SKIPPED ${id}: ${result.reason}`);
  } catch (err) {
    counts.skipped++;
    console.log(`FAILED  ${id}: ${err}`);
  }
}
console.log(`${counts.frozen} frozen, ${counts.already} already had hints, ${counts.skipped} skipped.`);
await db.$client.end();
