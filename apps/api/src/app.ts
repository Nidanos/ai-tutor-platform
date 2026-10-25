import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { accountRouter } from "./modules/m1_auth/routes/account.routes.js";
import { authRouter } from "./modules/m1_auth/routes/auth.routes.js";
import { diagnosticRouter } from "./modules/m3_diagnostic/routes/diagnostic.routes.js";
import { masteryRouter } from "./modules/m4_mastery/routes/mastery.routes.js";
import { recommendationsRouter } from "./modules/m5_recommender/routes/recommendations.routes.js";
import { exercisesRouter } from "./modules/m6_exercises/routes/exercises.routes.js";
import { lessonsRouter } from "./modules/m6_exercises/routes/lessons.routes.js";
import { submissionsRouter } from "./modules/m7_execution/routes/submissions.routes.js";
import { hintsRouter, lessonNotesRouter } from "./modules/m8_socratic/routes/hints.routes.js";
import { sessionsRouter } from "./modules/m9_sessions/routes/sessions.routes.js";
import { progressRouter } from "./modules/m11_progress/routes/progress.routes.js";
import { scaffoldingRouter } from "./modules/m12_scaffolding/routes/scaffolding.routes.js";
import { analyticsRouter } from "./modules/m13_analytics/routes/analytics.routes.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { checkOrigin } from "./shared/middlewares/check-origin.js";
import { vercelVisitor } from "./shared/middlewares/vercel-visitor.js";

export const app = express();

// Per-IP rate limits use req.ip. Only a proxy on this machine or its private network (Render's, or Caddy) may set it
// through X-Forwarded-For, and Vercel's visitor IP counts only with our secret (ADR-0008, ADR-0024). `next dev` passes
// on whatever the browser sends, so local dev trusts nobody.
app.set("trust proxy", env.NODE_ENV === "development" ? false : "loopback, uniquelocal");
app.use(vercelVisitor);
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(checkOrigin);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/me", accountRouter);
app.use("/api/v1/diagnostic", diagnosticRouter);
app.use("/api/v1/mastery", masteryRouter);
app.use("/api/v1/recommendations", recommendationsRouter);
app.use("/api/v1/exercises", exercisesRouter);
app.use("/api/v1/exercises", hintsRouter);
app.use("/api/v1/lessons", lessonsRouter);
app.use("/api/v1/lessons", lessonNotesRouter);
app.use("/api/v1/submissions", submissionsRouter);
app.use("/api/v1/scaffolding", scaffoldingRouter);
app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.use(errorHandler);
