import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { getExercise } from "../controllers/exercises.controller.js";

export const exercisesRouter = Router().get("/:id", authenticate, getExercise);
