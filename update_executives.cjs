const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS executives (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        department TEXT,
        row_level INTEGER NOT NULL,
        icon TEXT DEFAULT 'User'
    );
  `);
  console.log("Executives table created.");
  
  // Seed the data
  const executivesData = [
      { id: 1, name: 'Kasim Kedir', role: 'President', phone: '0914826816', department: 'COTM', row_level: 1, icon: 'Shield' },
      { id: 2, name: 'Ali Essay', role: 'Vice President', phone: '0910129591', department: 'Sociology', row_level: 2, icon: 'ShieldHalf' },
      { id: 8, name: 'Kedir Alemu', role: 'General', phone: '0917147116', department: 'COTM', row_level: 2, icon: 'Users' },
      { id: 3, name: 'Mohammed Hussen', role: 'Writer', phone: '0987025788', department: 'Pre-Engineering', row_level: 2, icon: 'PenTool' },
      { id: 9, name: 'Adem Mohammed', role: 'Information', phone: '0930829860', department: 'Journalism', row_level: 3, icon: 'Info' },
      { id: 10, name: 'Weynshat', role: 'Women', phone: '0944459224', department: 'LSCM', row_level: 3, icon: 'Heart' },
      { id: 11, name: 'Fuad Endris', role: 'Discipline', phone: '', department: 'Low', row_level: 3, icon: 'AlertOctagon' },
      { id: 4, name: 'Nuru Mohammed', role: 'K/ma/fetan', phone: '0925227591', department: 'COTM', row_level: 3, icon: 'Zap' },
      { id: 5, name: 'Yonnas Belay', role: 'Cafe', phone: '0989864356', department: 'Veterinary', row_level: 3, icon: 'Coffee' },
      { id: 6, name: 'Fuad', role: 'Health', phone: '0943762892', department: 'Plant Science', row_level: 4, icon: 'Activity' },
      { id: 7, name: 'Amanual', role: 'Space Police', phone: '0932160985', department: 'Sociology', row_level: 4, icon: 'Star' },
      { id: 12, name: 'Mussa Ahmed', role: 'Block', phone: '0963648356', department: 'Tourism', row_level: 4, icon: 'Box' },
      { id: 13, name: 'Hassen (BULU)', role: 'Sport', phone: '0935444651', department: 'EDPM', row_level: 4, icon: 'Trophy' },
      { id: 14, name: 'Selamawit Haylu', role: 'PVOS', phone: '0906369054', department: 'Accounting', row_level: 4, icon: 'Award' },
      { id: 15, name: 'Abdulhafiz M/D', role: 'Teaching', phone: '0963655186', department: 'COTM', row_level: 4, icon: 'BookOpen' },
      { id: 16, name: 'Abdo Mohammed', role: 'Library', phone: '0937848785', department: 'Economics', row_level: 4, icon: 'Library' },
      { id: 17, name: 'Dawud Ibrahim', role: 'Greenfication', phone: '0918511575', department: 'Water Engineering', row_level: 4, icon: 'Leaf' }
  ];
  
  // Clear existing to avoid dupes
  await pool.query('TRUNCATE executives RESTART IDENTITY');

  for (let e of executivesData) {
      await pool.query(
          'INSERT INTO executives (name, role, phone, department, row_level, icon) VALUES ($1, $2, $3, $4, $5, $6)',
          [e.name, e.role, e.phone, e.department, e.row_level, e.icon]
      );
  }
  console.log("Seeded executives.");
  process.exit();
}
run();
