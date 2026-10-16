import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { next } from "../controllers/recommendations.controller.js";

export const recommendationsRouter = Router().get("/next", authenticate, next);
