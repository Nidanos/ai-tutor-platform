import type { RequestHandler } from "express";
import { z } from "zod";
import { ok } from "../../../shared/http/envelope.js";
import { listState } from "../services/scaffolding.service.js";

const query = z.object({ language: z.string().min(1).max(20).optional() });

export const state: RequestHandler = async (req, res) => {
  res.json(ok({ skills: await listState(req.auth!.userId, query.parse(req.query).language) }));
};
