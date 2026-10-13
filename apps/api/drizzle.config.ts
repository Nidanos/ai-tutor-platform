import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/database/schema",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url: env.DATABASE_URL },
});
