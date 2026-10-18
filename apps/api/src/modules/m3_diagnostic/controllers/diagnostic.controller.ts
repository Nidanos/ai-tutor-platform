import type { RequestHandler } from "express";
import { z } from "zod";
import { courseFields } from "../../../shared/http/course-fields.js";
import { ok } from "../../../shared/http/envelope.js";
import { answerText } from "../../m7_execution/schemas/submissions.schemas.js";
import * as diagnostic from "../services/diagnostic.service.js";

const startBody = z.object({ ...courseFields, retake: z.boolean().default(false) });
const params = z.object({ id: z.uuid() });
// An answer is the predicted output or the code; "I don't know" / "Skip this task" sends dontKnow instead.
const answerBody = z.union([
  z.object({ itemId: z.uuid(), answer: answerText }),
  z.object({ itemId: z.uuid(), dontKnow: z.literal(true) }),
]);

export const start: RequestHandler = async (req, res) => {
  res.json(ok({ diagnostic: await diagnostic.start(req.auth!.userId, startBody.parse(req.body ?? {})) }));
};

export const answer: RequestHandler = async (req, res) => {
  const { id } = params.parse(req.params);
  res.json(ok({ diagnostic: await diagnostic.answer(req.auth!.userId, id, answerBody.parse(req.body)) }));
};

// 202 while the last code tasks are still running: the client asks again after retryAfterMs.
export const complete: RequestHandler = async (req, res) => {
  const result = await diagnostic.complete(req.auth!.userId, params.parse(req.params).id);
  res.status(result.status === "grading" ? 202 : 200).json(ok({ diagnostic: result }));
};
