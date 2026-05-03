import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function wipeCategories() {
  try {
    console.log("Wiping categories table...");
    
    await pool.query("TRUNCATE categories RESTART IDENTITY CASCADE");

    console.log("✅ Successfully wiped the categories table.");
  } catch (err) {
    console.error("Error wiping categories:", err);
  } finally {
    pool.end();
  }
}

wipeCategories();
