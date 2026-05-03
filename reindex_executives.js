import pg from "pg";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function reindexExecutives() {
  try {
    console.log("Reading executives_data.json...");
    const data = await fs.readFile("executives_data.json", "utf8");
    const executives = JSON.parse(data);
    
    console.log("Truncating executives table and restarting ID sequence...");
    await pool.query("TRUNCATE executives RESTART IDENTITY");

    console.log(`Inserting ${executives.length} executives with new IDs starting from 1...`);
    
    for (const ex of executives) {
      await pool.query(
        `INSERT INTO executives (name, role, phone, department, row_level, icon, image, student_category, telegram, "union")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          ex.name,
          ex.role,
          ex.phone,
          ex.department,
          ex.row_level,
          ex.icon,
          ex.image,
          ex.student_category,
          ex.telegram,
          ex.union
        ]
      );
    }
    
    console.log("✅ Successfully reindexed executives. IDs now start at 1.");
    
    // Fetch and update the JSON file to reflect the new IDs
    const { rows } = await pool.query("SELECT * FROM executives ORDER BY row_level ASC, id ASC");
    await fs.writeFile("executives_data.json", JSON.stringify(rows, null, 2));
    console.log("✅ executives_data.json has been updated with the new IDs.");
    
  } catch (err) {
    console.error("Error reindexing executives:", err);
  } finally {
    pool.end();
  }
}

reindexExecutives();
