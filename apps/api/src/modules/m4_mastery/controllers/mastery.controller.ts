import type { RequestHandler } from "express";
import { z } from "zod";
import { DEFAULT_LANGUAGE } from "../../../infrastructure/database/seed/data.js";
import { ok } from "../../../shared/http/envelope.js";
import { getSkillMastery, listMastery } from "../services/mastery-read.service.js";

const language = z.string().min(1).max(20);

export const list: RequestHandler = async (req, res) => {
  const query = z.object({ language: language.optional() }).parse(req.query);
  res.json(ok({ skills: await listMastery(req.auth!.userId, query.language) }));
};

export const detail: RequestHandler = async (req, res) => {
  const { skillId } = z.object({ skillId: z.uuid() }).parse(req.params);
  const query = z.object({ language: language.default(DEFAULT_LANGUAGE) }).parse(req.query);
  res.json(ok(await getSkillMastery(req.auth!.userId, skillId, query.language)));
};
