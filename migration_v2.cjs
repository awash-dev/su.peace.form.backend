const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log("🚀 Starting migration v2...");

    // 1. Update categories table with content fields
    await pool.query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS about_content TEXT,
      ADD COLUMN IF NOT EXISTS mission_content TEXT;
    `);
    console.log("✅ Updated categories table.");

    // 2. Create plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL, -- Links to categories.name
        status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed
        created_by TEXT NOT NULL, -- Admin email
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Created plans table.");

    // 3. Add executive_role to admins table if we want specific management
    // However, we can just use the existing role field and allow 'superadmin', 'admin', 
    // or specific ones like 'Health', 'Finance', etc.
    // Let's ensure the role column is long enough.
    await pool.query(`
      ALTER TABLE admins ALTER COLUMN role TYPE VARCHAR(50);
    `);
    console.log("✅ Updated admins role column size.");

    console.log("✨ Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
