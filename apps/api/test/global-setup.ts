import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "../src/config/env.ts";
import { TEST_DB_NAME, testDatabaseUrl } from "./test-db.ts";

const ALREADY_EXISTS = "42P04";

// Runs once before all tests: create the test database if needed, then apply every migration.
export async function setup() {
  const admin = new pg.Client(env.DATABASE_URL);
  await admin.connect();
  await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`).catch((e) => {
    if (e.code !== ALREADY_EXISTS) throw e;
  });
  await admin.end();

  const db = drizzle(testDatabaseUrl);
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.$client.end();
}
