import type { RequestHandler } from "express";
import { z } from "zod";
import { courseFields } from "../../../shared/http/course-fields.js";
import { ok } from "../../../shared/http/envelope.js";
import * as sessions from "../services/sessions.service.js";

const startBody = z.object(courseFields);
const params = z.object({ id: z.uuid() });
const statusBody = z.object({ status: z.enum(["active", "paused", "ended"]) });

export const start: RequestHandler = async (req, res) => {
  res.json(ok({ session: await sessions.start(req.auth!.userId, startBody.parse(req.body ?? {})) }));
};

export const active: RequestHandler = async (req, res) => {
  res.json(ok({ session: await sessions.active(req.auth!.userId) }));
};

export const setStatus: RequestHandler = async (req, res) => {
  const { id } = params.parse(req.params);
  res.json(ok({ session: await sessions.setStatus(req.auth!.userId, id, statusBody.parse(req.body).status) }));
};
