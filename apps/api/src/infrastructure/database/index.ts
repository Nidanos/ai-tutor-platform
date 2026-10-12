import { Pool } from "pg";
import dotenv from "dotenv";

// 1. Load environment variables from .env
dotenv.config();

// 2. Instantiate the PostgreSQL connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10, //Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
});

// 3. Helper function to execute SQL queries
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

