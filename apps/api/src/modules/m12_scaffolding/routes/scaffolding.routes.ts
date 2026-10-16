import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { state } from "../controllers/scaffolding.controller.js";

export const scaffoldingRouter = Router().get("/state", authenticate, state);
