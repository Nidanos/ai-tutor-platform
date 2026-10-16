import type { RequestHandler } from "express";
import { z } from "zod";
import { ok } from "../../../shared/http/envelope.js";
import { openAttempt } from "../../m7_execution/services/attempts.service.js";
import { getServableExercise } from "../services/exercises.service.js";

const params = z.object({ id: z.uuid() });

// Opening an exercise also starts (or resumes) the learner's attempt, so Submit always has one.
export const getExercise: RequestHandler = async (req, res) => {
  const exercise = await getServableExercise(params.parse(req.params).id);
  const attempt = await openAttempt(req.auth!.userId, exercise);
  res.json(ok({ exercise, attempt }));
};
