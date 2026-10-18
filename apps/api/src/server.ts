import { sql } from "drizzle-orm";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./infrastructure/database/index.js";
import { geminiProvider } from "./infrastructure/llm/gemini-provider.js";
import { startGenerationWorker } from "./infrastructure/queue/generation-queue.js";
import { startSubmissionWorker } from "./infrastructure/queue/submissions-queue.js";
import { runGeneration } from "./modules/m6_exercises/services/generate-exercise.js";
import { runSubmission } from "./modules/m7_execution/services/run-submission.js";
import { freezeHints } from "./modules/m8_socratic/services/freeze-hints.js";

await db.execute(sql`select 1`); // fail fast: never start without a database

// The worker shares this process for now; it moves to its own process when load needs it.
startSubmissionWorker(runSubmission);

// A generated exercise is served as soon as it is verified; its frozen hints follow (ADR-0016).
startGenerationWorker(async (jobId) => {
  const exerciseId = await runGeneration(jobId);
  if (exerciseId) await freezeHints(exerciseId, geminiProvider).catch((err) => console.error("Hints for a generated exercise failed", err));
});

app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
