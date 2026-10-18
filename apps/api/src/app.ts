import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { authRouter } from "./modules/m1_auth/routes/auth.routes.js";
import { diagnosticRouter } from "./modules/m3_diagnostic/routes/diagnostic.routes.js";
import { masteryRouter } from "./modules/m4_mastery/routes/mastery.routes.js";
import { recommendationsRouter } from "./modules/m5_recommender/routes/recommendations.routes.js";
import { exercisesRouter } from "./modules/m6_exercises/routes/exercises.routes.js";
import { submissionsRouter } from "./modules/m7_execution/routes/submissions.routes.js";
import { sessionsRouter } from "./modules/m9_sessions/routes/sessions.routes.js";
import { progressRouter } from "./modules/m11_progress/routes/progress.routes.js";
import { scaffoldingRouter } from "./modules/m12_scaffolding/routes/scaffolding.routes.js";
import { analyticsRouter } from "./modules/m13_analytics/routes/analytics.routes.js";
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
app.use("/api/v1/diagnostic", diagnosticRouter);
app.use("/api/v1/mastery", masteryRouter);
app.use("/api/v1/recommendations", recommendationsRouter);
app.use("/api/v1/exercises", exercisesRouter);
app.use("/api/v1/submissions", submissionsRouter);
app.use("/api/v1/scaffolding", scaffoldingRouter);
app.use("/api/v1/sessions", sessionsRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.use(errorHandler);
