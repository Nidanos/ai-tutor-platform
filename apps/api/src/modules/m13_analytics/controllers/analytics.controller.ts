import type { RequestHandler } from "express";
import { z } from "zod";
import { courseFields } from "../../../shared/http/course-fields.js";
import { ok } from "../../../shared/http/envelope.js";
import { overview as buildOverview } from "../services/analytics.service.js";

const query = z.object({ days: z.coerce.number().int().min(1).max(365).default(30), ...courseFields });

export const overview: RequestHandler = async (req, res) => {
  const { days, course, language } = query.parse(req.query);
  res.json(ok(await buildOverview(days, course, language)));
};
