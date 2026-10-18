import { eq } from "drizzle-orm";
import { db } from "../infrastructure/database/index.js";
import { users } from "../infrastructure/database/schema/index.js";

// There is no sign-up for admins: this promotes an existing account. The role is in the access
// token, so the person logs in again to use it.
const email = process.argv[2];
if (!email) {
  console.error("Usage: pnpm user:admin <email>");
  process.exit(1);
}
const [user] = await db.update(users).set({ role: "ADMIN" }).where(eq(users.email, email)).returning({ id: users.id });
console.log(user ? `${email} is now an admin. Log in again to use it.` : `No account with the email ${email}`);
await db.$client.end();
