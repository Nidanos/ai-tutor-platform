import type { Request, RequestHandler, Response } from "express";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../../../shared/auth/cookies.js";
import { ACCESS_TTL_SECONDS } from "../../../shared/auth/tokens.js";
import { ok } from "../../../shared/http/envelope.js";
import { loginBody, registerBody, tokenBody } from "../schemas/auth.schemas.js";
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
  res.json(ok({ user: await auth.me(req.auth!.userId) }));
};
