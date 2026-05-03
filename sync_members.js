import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function syncMemberCategories() {
  try {
    console.log("Synchronizing members: Setting category = position where category is empty...");
    
    const res = await pool.query(
      "UPDATE members SET category = position WHERE category IS NULL OR category = ''"
    );

    console.log(`✅ Successfully updated ${res.rowCount} members.`);
  } catch (err) {
    console.error("Error syncing members:", err);
  } finally {
    pool.end();
  }
}

syncMemberCategories();
