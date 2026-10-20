import type { RequestHandler } from "express";
import { z } from "zod";
import { DEFAULT_LANGUAGE } from "../../../infrastructure/database/seed/data.js";
import { ok } from "../../../shared/http/envelope.js";
import { getLesson } from "../services/lessons.service.js";

export const lesson: RequestHandler = async (req, res) => {
  const { skillId } = z.object({ skillId: z.uuid() }).parse(req.params);
  const { language } = z.object({ language: z.string().min(1).max(20).default(DEFAULT_LANGUAGE) }).parse(req.query);
  res.json(ok(await getLesson(req.auth!.userId, skillId, language)));
};
