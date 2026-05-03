import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log("Adding password_hash to members table...");
    await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
    console.log("Successfully updated schema.");
  } catch (e) {
    console.error("Failed to update schema:", e);
  } finally {
    pool.end();
  }
}

run();
