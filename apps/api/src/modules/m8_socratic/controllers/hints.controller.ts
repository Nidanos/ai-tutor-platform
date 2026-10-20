import type { RequestHandler } from "express";
import { z } from "zod";
import { ok } from "../../../shared/http/envelope.js";
import { answerText } from "../../m7_execution/schemas/submissions.schemas.js";
import { DEFAULT_LANGUAGE } from "../../../infrastructure/database/seed/data.js";
import { requestHint } from "../services/hints.service.js";
import { lessonNote } from "../services/lesson-note.service.js";

const params = z.object({ id: z.uuid() });
// The learner's current code (or rung-1 prediction) lets the tutor talk about their work.
const body = z.object({ code: answerText.optional() });

export const hint: RequestHandler = async (req, res) => {
  const { id } = params.parse(req.params);
  const { code } = body.parse(req.body ?? {});
  res.json(ok({ hint: await requestHint(req.auth!.userId, id, code) }));
};

export const note: RequestHandler = async (req, res) => {
  const { skillId } = z.object({ skillId: z.uuid() }).parse(req.params);
  const { language } = z.object({ language: z.string().min(1).max(20).default(DEFAULT_LANGUAGE) }).parse(req.query);
  res.json(ok({ note: await lessonNote(req.auth!.userId, skillId, language) }));
};
