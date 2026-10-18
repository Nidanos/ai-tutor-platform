import { Queue, Worker } from "bullmq";
import { env } from "../../config/env.js";

const QUEUE = "generation";

const { hostname, port } = new URL(env.REDIS_URL);
const connection = { host: hostname, port: Number(port) || 6379 };

// Created on first use, so importing this module (e.g. in tests) doesn't open a Redis connection.
let queue: Queue | undefined;

// jobId = the generation job's id: the same job is never queued twice. The pipeline makes its own
// tries (ADR-0016), so BullMQ doesn't retry.
export const enqueueGeneration = (generationJobId: string) =>
  (queue ??= new Queue(QUEUE, { connection })).add("generate", { generationJobId }, { jobId: generationJobId, removeOnComplete: 1_000, removeOnFail: 1_000 });

// One at a time: each job makes LLM calls and about 5 sandbox runs, and must not crowd out learners' runs.
export const startGenerationWorker = (run: (generationJobId: string) => Promise<void>) =>
  new Worker<{ generationJobId: string }>(QUEUE, (job) => run(job.data.generationJobId), { connection, concurrency: 1 });
