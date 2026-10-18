import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { progress } from "../controllers/progress.controller.js";

export const progressRouter = Router().get("/", authenticate, progress);
