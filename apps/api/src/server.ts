import { app } from "./app.js";
import { query } from "./infrastructure/database/index.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

// Temporary connection test runner
async function testConnection() {
  try {
    const res = await query("SELECT NOW()");
    console.log("✅ Database connected successfully at:", res.rows[0]);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

testConnection();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
