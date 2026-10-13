import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { fail } from "../http/envelope.js";
import { AppError } from "./app-error.js";

// Express 5 sends every thrown or rejected error here.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) return res.status(err.status).json(fail(err.code, err.message));
  if (err instanceof ZodError) return res.status(400).json(fail("VALIDATION_ERROR", "Invalid request", err.issues));
  if (err.type === "entity.parse.failed") return res.status(400).json(fail("INVALID_JSON", "Body is not valid JSON"));

  console.error(err); // unexpected: log the detail, never send it to the client
  res.status(500).json(fail("INTERNAL_ERROR", "Something went wrong"));
};
