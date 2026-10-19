import type { RequestHandler } from "express";
import { z } from "zod";
import { courseFields } from "../../../shared/http/course-fields.js";
import { ok } from "../../../shared/http/envelope.js";
import { nextStep } from "../services/recommender.service.js";

const query = z.object(courseFields);

export const next: RequestHandler = async (req, res) => {
  const { course, language } = query.parse(req.query);
  res.json(ok(await nextStep(req.auth!.userId, course, language)));
};
