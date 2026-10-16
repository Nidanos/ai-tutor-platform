import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { detail, list } from "../controllers/mastery.controller.js";

export const masteryRouter = Router().get("/", authenticate, list).get("/:skillId", authenticate, detail);
