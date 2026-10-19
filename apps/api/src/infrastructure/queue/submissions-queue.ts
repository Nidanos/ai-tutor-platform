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

// E2B Hobby allows 1 new sandbox per second (ADR-0003); a run takes ~5 s, so about 5 run at once.
export const startSubmissionWorker = (run: (submissionId: string, isLastTry: boolean) => Promise<void>) =>
  new Worker<{ submissionId: string }>(
    QUEUE,
    (job) => run(job.data.submissionId, job.attemptsMade + 1 >= MAX_TRIES),
    { connection, concurrency: 5, limiter: { max: 1, duration: 1_000 } },
  );
