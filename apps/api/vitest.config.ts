import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./test/test-db.ts";

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDatabaseUrl, GEMINI_PAID: "false", ORIGIN_SECRET: "test-origin-secret-0123456789abcdef", DEV_WEB_ORIGIN: "http://localhost:4000" }, // tests never call Gemini: they use fakes
    globalSetup: "./test/global-setup.ts",
    setupFiles: "./test/close-db.ts",
  },
});
