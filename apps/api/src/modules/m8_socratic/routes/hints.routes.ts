import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { hintsByUser } from "../../../shared/middlewares/rate-limit.js";
import { hint, note } from "../controllers/hints.controller.js";

// Mounted under /api/v1/exercises next to M6's router: POST /exercises/:id/hints.
export const hintsRouter = Router().post("/:id/hints", authenticate, hintsByUser, hint);

// Mounted under /api/v1/lessons next to M6's router: POST /lessons/:skillId/note (ADR-0019).
export const lessonNotesRouter = Router().post("/:skillId/note", authenticate, hintsByUser, note);
