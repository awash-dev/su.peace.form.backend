import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function wipeDB() {
  try {
    console.log("Wiping database tables (excluding executives, admins, categories, and settings)...");
    
    // We wipe members, posts, messages, resources, plans, meetings
    await pool.query("TRUNCATE members RESTART IDENTITY CASCADE");
    await pool.query("TRUNCATE posts RESTART IDENTITY CASCADE");
    await pool.query("TRUNCATE messages RESTART IDENTITY CASCADE");
    await pool.query("TRUNCATE resources RESTART IDENTITY CASCADE");
    await pool.query("TRUNCATE plans RESTART IDENTITY CASCADE");
    await pool.query("TRUNCATE meetings RESTART IDENTITY CASCADE");

    console.log("✅ Successfully wiped all transactional data.");
  } catch (err) {
    console.error("Error wiping database:", err);
  } finally {
    pool.end();
  }
}

wipeDB();
