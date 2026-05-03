import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function checkDb() {
  try {
    const mem = await pool.query("SELECT DISTINCT position FROM members");
    console.log(`Member positions:`, mem.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkDb();
