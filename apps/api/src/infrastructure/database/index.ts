import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "../../config/env.js";

// casing: TypeScript uses camelCase, the database gets snake_case automatically.
export const db = drizzle({ connection: env.DATABASE_URL, casing: "snake_case" });
