import { sql } from "drizzle-orm";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./infrastructure/database/index.js";

await db.execute(sql`select 1`); // fail fast: never start without a database

app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
