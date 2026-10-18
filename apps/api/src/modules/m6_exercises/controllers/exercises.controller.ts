import type { RequestHandler } from "express";
import { z } from "zod";
import { courseFields } from "../../../shared/http/course-fields.js";
import { ok } from "../../../shared/http/envelope.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { getCourse, getSkillGraph } from "../../m2_skills/services/skills.service.js";
import { openAttempt } from "../../m7_execution/services/attempts.service.js";
import { getServableExercise } from "../services/exercises.service.js";
import { getGenerationJob, requestGeneration } from "../services/request-generation.js";

const params = z.object({ id: z.uuid() });

// Opening an exercise also starts (or resumes) the learner's attempt, so Submit always has one.
export const getExercise: RequestHandler = async (req, res) => {
  const exercise = await getServableExercise(params.parse(req.params).id);
  const attempt = await openAttempt(req.auth!.userId, exercise);
  res.json(ok({ exercise, attempt }));
};

const generateBody = z.object({ skill: z.string().min(1).max(80), rung: z.number().int().min(1).max(5), ...courseFields });
const jobParams = z.object({ jobId: z.uuid() });

// 202: generation runs in the background; poll GET /exercises/generation/:jobId.
export const generate: RequestHandler = async (req, res) => {
  const { skill: slug, rung, course, language } = generateBody.parse(req.body);
  const { id: courseId } = await getCourse(course, language);
  const skill = (await getSkillGraph(courseId, language)).find((s) => s.slug === slug);
  if (!skill) throw new AppError(404, "SKILL_NOT_FOUND", "No such skill in this course");
  const job = await requestGeneration({ skillId: skill.id, languageCode: language, rung }, req.auth!.userId);
  res.status(202).json(ok({ job }));
};

export const generationStatus: RequestHandler = async (req, res) => {
  res.json(ok({ job: await getGenerationJob(jobParams.parse(req.params).jobId) }));
};
