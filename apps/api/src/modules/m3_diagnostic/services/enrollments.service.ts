import * as repo from "../repositories/enrollments.repository.js";

// Opening an exercise enrolls the learner in its course; the diagnostic adds a goal later.
export const ensureEnrollment = repo.ensureEnrollment;
