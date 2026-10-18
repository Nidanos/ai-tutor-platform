import { Router } from "express";
import { authenticate, requireRole } from "../../../shared/middlewares/authenticate.js";
import { overview } from "../controllers/analytics.controller.js";

export const analyticsRouter = Router().get("/overview", authenticate, requireRole("ADMIN"), overview);
