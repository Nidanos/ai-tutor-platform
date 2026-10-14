import type { RequestHandler } from "express";
import { ok } from "../../../shared/http/envelope.js";
import { submissionBody, submissionParams } from "../schemas/submissions.schemas.js";
import * as submissions from "../services/submissions.service.js";

export const submit: RequestHandler = async (req, res) => {
  res.status(202).json(ok(await submissions.submit(req.auth!.userId, submissionBody.parse(req.body))));
};

export const result: RequestHandler = async (req, res) => {
  const { id } = submissionParams.parse(req.params);
  res.json(ok(await submissions.getResult(req.auth!.userId, id)));
};
