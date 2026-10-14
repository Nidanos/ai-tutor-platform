import { sql } from "drizzle-orm";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./infrastructure/database/index.js";
import { startSubmissionWorker } from "./infrastructure/queue/submissions-queue.js";
import { runSubmission } from "./modules/m7_execution/services/run-submission.js";

await db.execute(sql`select 1`); // fail fast: never start without a database

// The worker shares this process for now; it moves to its own process when load needs it.
startSubmissionWorker(runSubmission);

app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
