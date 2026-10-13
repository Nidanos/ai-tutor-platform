import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./test/test-db.ts";

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDatabaseUrl },
    globalSetup: "./test/global-setup.ts",
    setupFiles: "./test/close-db.ts",
  },
});
