import type { RequestHandler } from "express";
import { z } from "zod";
import { courseFields } from "../../../shared/http/course-fields.js";
import { ok } from "../../../shared/http/envelope.js";
import { getProgress } from "../services/progress.service.js";

const query = z.object(courseFields);

export const progress: RequestHandler = async (req, res) => {
  const { course, language } = query.parse(req.query);
  res.json(ok(await getProgress(req.auth!.userId, course, language)));
};
