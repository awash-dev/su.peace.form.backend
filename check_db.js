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
    const mem = await pool.query("SELECT COUNT(*) FROM members");
    const exec = await pool.query("SELECT COUNT(*) FROM executives");
    const adm = await pool.query("SELECT COUNT(*) FROM admins");
    
    console.log(`Members: ${mem.rows[0].count}`);
    console.log(`Executives: ${exec.rows[0].count}`);
    console.log(`Admins: ${adm.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkDb();
