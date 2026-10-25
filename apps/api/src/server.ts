import { sql } from "drizzle-orm";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./infrastructure/database/index.js";
import { geminiProvider } from "./infrastructure/llm/gemini-provider.js";
import { startErasureJob } from "./infrastructure/queue/erasure-queue.js";
import { startGenerationWorker } from "./infrastructure/queue/generation-queue.js";
import { startSubmissionWorker } from "./infrastructure/queue/submissions-queue.js";
import { eraseDueAccounts } from "./modules/m1_auth/services/erasure.service.js";
import { runGeneration } from "./modules/m6_exercises/services/generate-exercise.js";
import { runSubmission } from "./modules/m7_execution/services/run-submission.js";
import { requeueUnfinished } from "./modules/m7_execution/services/submissions.service.js";
import { freezeHints } from "./modules/m8_socratic/services/freeze-hints.js";

await db.execute(sql`select 1`); // fail fast: never start without a database

// The worker shares this process for now; it moves to its own process when load needs it.
startSubmissionWorker(runSubmission);
requeueUnfinished().catch((err) => console.error("Re-queueing unfinished submissions failed", err));

// A generated exercise is served as soon as it is verified; its frozen hints follow (ADR-0016).
startGenerationWorker(async (jobId) => {
  const exerciseId = await runGeneration(jobId);
  if (exerciseId) await freezeHints(exerciseId, geminiProvider).catch((err) => console.error("Hints for a generated exercise failed", err));
});

// Accounts whose deletion grace period is over are erased within the hour (DELETE /me).
startErasureJob(eraseDueAccounts).catch((err) => console.error("The erasure job failed to start", err));

app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
