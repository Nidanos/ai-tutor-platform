import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { diagnosticByUser } from "../../../shared/middlewares/rate-limit.js";
import { answer, complete, start } from "../controllers/diagnostic.controller.js";

export const diagnosticRouter = Router()
  .post("/start", authenticate, diagnosticByUser, start)
  .post("/:id/answers", authenticate, diagnosticByUser, answer)
  .post("/:id/complete", authenticate, diagnosticByUser, complete);
