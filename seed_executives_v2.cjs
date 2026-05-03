require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DB,
});

const executives = [
  { name: 'Kasim Kedir', role: 'President', department: 'COTM', phone: '0914826816', row_level: 1, icon: 'Crown' },
  { name: 'Ali Essay', role: 'Vice President', department: 'Sociology', phone: '0910129591', row_level: 1, icon: 'Shield' },
  { name: 'Kedir Alemu', role: 'General Secretary', department: 'COTM', phone: '0917147116', row_level: 1, icon: 'Users' },
  { name: 'Mohammed Hussen', role: 'Writer', department: 'Pre-Engineering', phone: '0987025788', row_level: 2, icon: 'BookOpen' },
  { name: 'Adem Mohammed', role: 'Information', department: 'Journalism', phone: '0930829860', row_level: 2, icon: 'Activity' },
  { name: 'Weynshat', role: 'Women Affair', department: 'LSCM', phone: '0944459224', row_level: 2, icon: 'Heart' },
  { name: 'Fuad Endris', role: 'Discipline', department: 'Low', phone: '', row_level: 2, icon: 'Shield' },
  { name: 'Nuru Mohammed', role: 'K/ma/fetan', department: 'COTM', phone: '0925227591', row_level: 2, icon: 'Zap' },
  { name: 'Yonnas Belay', role: 'Cafe', department: 'Veterinary', phone: '0989864356', row_level: 2, icon: 'Users' },
  { name: 'Fuad', role: 'Health', department: 'Plant Science', phone: '0943762892', row_level: 2, icon: 'Activity' },
  { name: 'Amanual', role: 'Space Police', department: 'Sociology', phone: '0932160985', row_level: 2, icon: 'Shield' },
  { name: 'Mussa Ahmed', role: 'Block', department: 'Tourism', phone: '0963648356', row_level: 2, icon: 'Building2' },
  { name: 'Hassen (BULU)', role: 'Sport', department: 'EDPM', phone: '0935444651', row_level: 2, icon: 'Trophy' },
  { name: 'Selamawit Haylu', role: 'PVOS', department: 'Accounting', phone: '0906369054', row_level: 2, icon: 'Star' },
  { name: 'Abdulhafiz M/D', role: 'Teaching', department: 'COTM', phone: '0963655186', row_level: 2, icon: 'BookOpen' },
  { name: 'Abdo Mohammed', role: 'Library', department: 'Economics', phone: '0937848785', row_level: 2, icon: 'Library' },
  { name: 'Dawud Ibrahim', role: 'Greenfication', department: 'Water Engineering', phone: '0918511575', row_level: 2, icon: 'Leaf' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear existing
    await client.query('DELETE FROM executives');
    
    for (const ex of executives) {
      await client.query(
        'INSERT INTO executives (name, role, department, phone, row_level, icon) VALUES ($1, $2, $3, $4, $5, $6)',
        [ex.name, ex.role, ex.department, ex.phone, ex.row_level, ex.icon]
      );
    }
    
    await client.query('COMMIT');
    console.log('✅ Executives seeded successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
