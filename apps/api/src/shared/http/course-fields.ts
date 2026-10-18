import { z } from "zod";
import { DEFAULT_COURSE, DEFAULT_LANGUAGE } from "../../infrastructure/database/seed/data.js";

// Which course and language a learner request is about; both optional, defaulting to the first course.
export const courseFields = {
  course: z.string().min(1).max(60).default(DEFAULT_COURSE),
  language: z.string().min(1).max(20).default(DEFAULT_LANGUAGE),
};
