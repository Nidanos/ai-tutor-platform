import { Queue, Worker } from "bullmq";
import { connection } from "./connection.js";

const QUEUE = "submissions";
export const MAX_TRIES = 3; // the first run plus 2 retries after a sandbox error

// Created on first use, so importing this module (e.g. in tests) doesn't open a Redis connection.
let queue: Queue | undefined;

// jobId = submissionId: the same submission can never be queued twice.
export const enqueueSubmission = (submissionId: string) =>
  (queue ??= new Queue(QUEUE, { connection })).add(
    "run",
    { submissionId },
    { jobId: submissionId, attempts: MAX_TRIES, backoff: { type: "exponential", delay: 2_000 }, removeOnComplete: 1_000, removeOnFail: 1_000 },
  );

// E2B Hobby allows 1 new sandbox per second (ADR-0003). A run takes 5–10 s, so up to 10 run at once:
// with 5, a burst of submissions left the start limit unused (load check, 23 Oct). Hobby allows 20 at once.
export const startSubmissionWorker = (run: (submissionId: string, isLastTry: boolean) => Promise<void>) =>
  new Worker<{ submissionId: string }>(
    QUEUE,
    (job) => run(job.data.submissionId, job.attemptsMade + 1 >= MAX_TRIES),
    { connection, concurrency: 10, limiter: { max: 1, duration: 1_000 } },
  );
