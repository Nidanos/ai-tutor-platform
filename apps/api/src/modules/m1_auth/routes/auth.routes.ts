import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { forgotByIp, loginByIp, loginFailuresByEmail, refreshByIp, registerByIp, resetByIp } from "../../../shared/middlewares/rate-limit.js";
import { forgotPassword, login, logout, me, refresh, register, resetPassword } from "../controllers/auth.controller.js";

export const authRouter = Router()
  .post("/register", registerByIp, register)
  .post("/login", loginByIp, loginFailuresByEmail, login)
  .post("/refresh", refreshByIp, refresh)
  .post("/logout", logout)
  .get("/me", authenticate, me)
  .post("/forgot-password", forgotByIp, forgotPassword)
  .post("/reset-password", resetByIp, resetPassword);
