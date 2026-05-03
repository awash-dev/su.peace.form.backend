import fs from 'fs/promises';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function parseAndSeed() {
  try {
    const rawData = await fs.readFile('raw_members.txt', 'utf8');
    const lines = rawData.split('\n').filter(line => line.trim() && /^\d+\./.test(line));

    console.log(`Found ${lines.length} members to insert.`);

    const defaultPassword = '12345678';
    const hash = await bcrypt.hash(defaultPassword, 10);

    let inserted = 0;

    for (let line of lines) {
      // The columns are separated by tabs, but some might be multiple tabs.
      // Easiest is to split by tab and clean up.
      const parts = line.split('\t').map(p => p.trim());
      
      // Typical structure: S.N, empty, NAME, DEPARTMENT, ID_NUMBER(optional), YEAR, PHONE, POSSION
      // Let's filter out completely empty parts to see what we have:
      // Wait, if ID_NUMBER is missing, we might have less parts.
      // Let's use a regex to capture it more reliably, or just look at the raw parts:
      
      const nonEmpty = parts.filter(p => p !== '');
      if (nonEmpty.length < 5) continue; // Skip malformed
      
      let name, dept, idNum = '', year = '', phone = '', pos = '';
      
      // S.N is nonEmpty[0]
      name = nonEmpty[1];
      
      // The rest of the elements from the right:
      pos = nonEmpty[nonEmpty.length - 1];
      phone = nonEmpty[nonEmpty.length - 2];
      year = nonEmpty[nonEmpty.length - 3];
      
      // Now between name and year, there's department and optional ID
      const middle = nonEmpty.slice(2, nonEmpty.length - 3);
      if (middle.length === 1) {
        dept = middle[0];
      } else if (middle.length === 2) {
        dept = middle[0];
        idNum = middle[1];
      } else {
        dept = middle.join(' ');
      }
      
      // Clean up POSSION (e.g. INFO -> INFORMATION, TEACHE HIM -> TEACHING, etc.)
      if (pos.includes('TEACH')) pos = 'TEACHING';
      if (pos.includes('INFO')) pos = 'INFORMATION';
      if (pos.includes('LIBRERIY')) pos = 'LIBRARY';
      if (pos.includes('DISPILEN')) pos = 'DISCIPLINE';
      if (pos.includes('PEACE VALUE')) pos = 'PEACE VALUE ORGANIZATION SECTOR';
      if (pos.includes('GENERAL')) pos = 'GENERAL SERVICE';
      if (pos.includes('WOMEN')) pos = 'WOMEN AFFAIR';

      // Ensure valid email
      const emailName = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15);
      const email = `${emailName}_${nonEmpty[0].replace('.', '')}@samu.edu.et`;

      await pool.query(
        `INSERT INTO members (name, email, phone, department, id_number, graduation_year, position, status, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8)`,
        [name, email, phone, dept, idNum, year, pos, hash]
      );
      
      inserted++;
    }
    
    console.log(`✅ Successfully seeded ${inserted} members into the database.`);

  } catch (e) {
    console.error('Error during seeding:', e);
  } finally {
    pool.end();
  }
}

parseAndSeed();
