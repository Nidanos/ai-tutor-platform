import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { active, setStatus, start } from "../controllers/sessions.controller.js";

export const sessionsRouter = Router()
  .post("/", authenticate, start)
  .get("/active", authenticate, active)
  .patch("/:id", authenticate, setStatus);
