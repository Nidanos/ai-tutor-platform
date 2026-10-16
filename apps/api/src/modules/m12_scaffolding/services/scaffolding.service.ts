import * as repo from "../repositories/scaffolding.repository.js";

// Only M12 writes fade stages (design §3). The stage sets how much help an attempt may get.
export const getStage = repo.ensureStage;
