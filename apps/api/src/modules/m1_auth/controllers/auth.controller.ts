import type { Request, RequestHandler, Response } from "express";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../../../shared/auth/cookies.js";
import { ACCESS_TTL_SECONDS } from "../../../shared/auth/tokens.js";
import { ok } from "../../../shared/http/envelope.js";
import { forgotPasswordBody, loginBody, registerBody, resetPasswordBody, tokenBody } from "../schemas/auth.schemas.js";
import { placedCourse } from "../../m3_diagnostic/services/diagnostic.service.js";
import * as auth from "../services/auth.service.js";

const device = (req: Request) => ({ userAgent: req.get("user-agent")?.slice(0, 300), ip: req.ip });
const refreshTokenOf = (req: Request) => req.cookies?.[REFRESH_COOKIE] ?? tokenBody.parse(req.body ?? {}).refreshToken;

// Web gets httpOnly cookies and an empty 204; mobile gets the tokens in the body.
function sendSession(res: Response, session: Awaited<ReturnType<typeof auth.login>>) {
  if (session.client === "mobile") {
    const { accessToken, refreshToken } = session;
    return res.json(ok({ accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS }));
  }
  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.status(204).end();
}

// Registration doesn't log in: the user is sent to the login screen next.
export const register: RequestHandler = async (req, res) => {
  res.status(201).json(ok({ user: await auth.register(registerBody.parse(req.body)) }));
};

export const login: RequestHandler = async (req, res) => {
  const { client, ...credentials } = loginBody.parse(req.body);
  sendSession(res, await auth.login(credentials, client, device(req)));
};

export const refresh: RequestHandler = async (req, res) => {
  sendSession(res, await auth.refresh(refreshTokenOf(req), device(req)));
};

export const logout: RequestHandler = async (req, res) => {
  await auth.logout(refreshTokenOf(req));
  clearAuthCookies(res);
  res.status(204).end();
};

export const me: RequestHandler = async (req, res) => {
  const [user, placementCourse] = await Promise.all([auth.me(req.auth!.userId), placedCourse(req.auth!.userId)]);
  res.json(ok({ user: { ...user, placementCourse } }));
};

// 202 and the same words whether or not the account exists (ADR-0017).
export const forgotPassword: RequestHandler = (req, res) => {
  auth.forgotPassword(forgotPasswordBody.parse(req.body).email);
  res.status(202).json(ok({ message: "If an account uses that email, a reset link is on its way. It works for 30 minutes." }));
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { token, password } = resetPasswordBody.parse(req.body);
  await auth.resetPassword(token, password);
  res.status(204).end();
};
