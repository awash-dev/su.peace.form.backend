import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

const POSITIONS = ['CAFFE','SPACE POLICE','TEACHING','PEACE VALUE ORGANIZATION SECTOR','GREEN AREA','LIBRARY','GENERAL SERVICE','DISCIPLINE','SPORT','HEALTH','WOMEN AFFAIR','BLOCK','INFORMATION','FINANCE'];

async function seedCategories() {
  try {
    console.log("Seeding categories...");

    await pool.query("TRUNCATE categories RESTART IDENTITY CASCADE");

    for (const pos of POSITIONS) {
      await pool.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2)",
        [pos, `Official Union Branch for ${pos}`]
      );
    }
    
    console.log(`✅ Successfully seeded ${POSITIONS.length} categories.`);

    console.log("Fixing member roles: LITERARY -> LIBRARY, POLICE -> SPACE POLICE...");
    const u1 = await pool.query("UPDATE members SET position = 'LIBRARY' WHERE position = 'LITERARY'");
    const u2 = await pool.query("UPDATE members SET position = 'SPACE POLICE' WHERE position = 'POLICE'");
    console.log(`✅ Updated ${u1.rowCount} LITERARY -> LIBRARY`);
    console.log(`✅ Updated ${u2.rowCount} POLICE -> SPACE POLICE`);

  } catch (err) {
    console.error("Error seeding categories:", err);
  } finally {
    pool.end();
  }
}

seedCategories();
