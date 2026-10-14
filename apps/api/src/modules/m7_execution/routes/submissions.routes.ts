import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { submissionsByUser } from "../../../shared/middlewares/rate-limit.js";
import { result, submit } from "../controllers/submissions.controller.js";

export const submissionsRouter = Router()
  .post("/", authenticate, submissionsByUser, submit)
  .get("/:id/result", authenticate, result);
