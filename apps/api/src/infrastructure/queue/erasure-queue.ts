import { Queue, Worker } from "bullmq";
import { connection } from "./connection.js";

const QUEUE = "erasure";
const HOUR_MS = 3_600_000;

// Account erasure (DELETE /me) runs hourly. The schedule lives in Redis and is upserted on every start,
// so restarts and extra API processes never add a second one.
export async function startErasureJob(run: () => Promise<void>) {
  await new Queue(QUEUE, { connection }).upsertJobScheduler(
    "hourly",
    { every: HOUR_MS },
    { name: "erase-due-accounts", opts: { removeOnComplete: 100, removeOnFail: 100 } },
  );
  return new Worker(QUEUE, run, { connection });
}
