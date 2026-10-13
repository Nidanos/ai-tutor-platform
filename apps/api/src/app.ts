import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./modules/m1_auth/routes/auth.routes.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { checkOrigin } from "./shared/middlewares/check-origin.js";

export const app = express();

// The web app reaches us through the Next.js proxy: trust its one hop for the real client IP.
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(checkOrigin);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);

app.use(errorHandler);
