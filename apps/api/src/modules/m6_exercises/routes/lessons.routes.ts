import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { lesson } from "../controllers/lessons.controller.js";

// Lessons (ADR-0019): GET /lessons/:skillId. M8's live note sits next to it, under the same path.
export const lessonsRouter = Router().get("/:skillId", authenticate, lesson);
