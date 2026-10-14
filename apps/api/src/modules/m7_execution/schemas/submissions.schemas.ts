import { z } from "zod";

const MAX_ANSWER_BYTES = 65_536; // matches the submissions_answer_size CHECK

export const submissionBody = z.object({
  attemptId: z.uuid(),
  answer: z
    .string()
    .min(1)
    .refine((a) => Buffer.byteLength(a) <= MAX_ANSWER_BYTES, "Answer is larger than 64 KB"),
  // Made by the client per press of Submit, so a retried request never runs twice.
  idempotencyKey: z.string().min(8).max(100),
});

export type SubmissionInput = z.infer<typeof submissionBody>;

export const submissionParams = z.object({ id: z.uuid() });
