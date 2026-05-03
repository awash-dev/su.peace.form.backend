import pg from "pg";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function fetchExecutives() {
  try {
    console.log("Fetching all executives from the database...");
    const { rows } = await pool.query("SELECT * FROM executives ORDER BY row_level ASC, id ASC");
    
    console.log(`Successfully fetched ${rows.length} executives.`);
    
    // Save to a JSON file
    await fs.writeFile("executives_data.json", JSON.stringify(rows, null, 2));
    console.log("All executive data has been saved to executives_data.json");
    
    // Also print to console
    console.log(rows);
  } catch (err) {
    console.error("Error fetching executives:", err);
  } finally {
    pool.end();
  }
}

fetchExecutives();
