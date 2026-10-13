import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { loginByIp, loginFailuresByEmail, refreshByIp, registerByIp } from "../../../shared/middlewares/rate-limit.js";
import { login, logout, me, refresh, register } from "../controllers/auth.controller.js";

export const authRouter = Router()
  .post("/register", registerByIp, register)
  .post("/login", loginByIp, loginFailuresByEmail, login)
  .post("/refresh", refreshByIp, refresh)
  .post("/logout", logout)
  .get("/me", authenticate, me);
