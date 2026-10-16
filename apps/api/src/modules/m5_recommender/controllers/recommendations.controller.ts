import type { RequestHandler } from "express";
import { z } from "zod";
import { DEFAULT_LANGUAGE } from "../../../infrastructure/database/seed/data.js";
import { ok } from "../../../shared/http/envelope.js";
import { nextStep } from "../services/recommender.service.js";

const query = z.object({
  course: z.string().min(1).max(60).default("cpp-basics"),
  language: z.string().min(1).max(20).default(DEFAULT_LANGUAGE),
});

export const next: RequestHandler = async (req, res) => {
  const { course, language } = query.parse(req.query);
  res.json(ok({ recommendation: await nextStep(req.auth!.userId, course, language) }));
};
