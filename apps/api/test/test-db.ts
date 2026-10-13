import { env } from "../src/config/env.ts";

// Tests get their own database next to the dev one, so dev data is never touched.
export const TEST_DB_NAME = "ai_tutor_test";

const url = new URL(env.DATABASE_URL);
url.pathname = `/${TEST_DB_NAME}`;
export const testDatabaseUrl = url.toString();
