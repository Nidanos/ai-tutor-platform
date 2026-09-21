import express from "express";
import cors from "cors";
import helmet from "helmet";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "AI Tutor Enterprise API (M1-M13)" });
});

// Module Routes Mount Points (M1 to M13)
// app.use('/api/v1/auth', m1Router);
// app.use('/api/v1/skills', m2Router);
// app.use('/api/v1/diagnostic', m3Router);
// app.use('/api/v1/mastery', m4Router);
// app.use('/api/v1/recommendations', m5Router);
// app.use('/api/v1/exercises', m6Router);
// app.use('/api/v1/submissions', m7Router);
// app.use('/api/v1/hints', m8Router);
// app.use('/api/v1/sessions', m9Router);
// app.use('/api/v1/reviews', m10Router);
// app.use('/api/v1/progress', m11Router);
// app.use('/api/v1/scaffolding', m12Router);
// app.use('/api/v1/analytics', m13Router);
