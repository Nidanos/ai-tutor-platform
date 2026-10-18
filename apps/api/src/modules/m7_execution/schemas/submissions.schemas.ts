import { z } from "zod";

const MAX_ANSWER_BYTES = 65_536; // matches the submissions_answer_size CHECK

export const answerText = z
  .string()
  .min(1)
  .refine((a) => Buffer.byteLength(a) <= MAX_ANSWER_BYTES, "Answer is larger than 64 KB")
  .refine((a) => !a.includes("\0"), "Answer contains a NUL character"); // Postgres text can't store one

export const submissionBody = z.object({
  attemptId: z.uuid(),
  answer: answerText,
  // Made by the client per press of Submit, so a retried request never runs twice.
  idempotencyKey: z.string().min(8).max(100),
});

export type SubmissionInput = z.infer<typeof submissionBody>;

export const submissionParams = z.object({ id: z.uuid() });
