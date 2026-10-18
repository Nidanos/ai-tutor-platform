import { Router } from "express";
import { authenticate, requireRole } from "../../../shared/middlewares/authenticate.js";
import { generate, generationStatus, getExercise } from "../controllers/exercises.controller.js";

export const exercisesRouter = Router()
  .post("/generate", authenticate, requireRole("ADMIN", "AUTHOR"), generate)
  .get("/generation/:jobId", authenticate, requireRole("ADMIN", "AUTHOR"), generationStatus)
  .get("/:id", authenticate, getExercise);
