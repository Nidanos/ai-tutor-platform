import { afterAll } from "vitest";
import { db } from "../src/infrastructure/database/index.js";

afterAll(() => db.$client.end());
