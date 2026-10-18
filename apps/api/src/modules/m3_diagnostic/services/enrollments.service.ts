import * as repo from "../repositories/enrollments.repository.js";

// Opening an exercise, the placement test or "what next" enrolls the learner. No goal is set yet (ADR-0012).
export const ensureEnrollment = repo.ensureEnrollment;
