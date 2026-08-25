const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['Prof. RamaKishore', 'rama_admin@joineazy.com', passwordHash]
    );

    const students = [
      { name: 'Sourabh Gupta', email: 'sourabh@joineazy.com', studentId: 'STU001' },
      { name: 'Rishit Gupta', email: 'rishi@joineazy.com', studentId: 'STU003' },
      { name: 'Tanishq Saxena', email: 'tanz@joineazy.com', studentId: 'STU004' },
      { name: 'Shikhar Gautam', email: 'panda@joineazy.com', studentId: 'STU002' },
      { name: 'Soumya', email: 'sam@joineazy.com', studentId: 'STU005' },
      { name: 'Krish', email: 'krish@joineazy.com', studentId: 'STU006' }
    ];

    for (const s of students) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, student_id)
         VALUES ($1, $2, $3, 'student', $4)
         ON CONFLICT (email) DO NOTHING`,
        [s.name, s.email, passwordHash, s.studentId]
      );
    }

    console.log('Seed complete.');
  }
  catch (err) {
    console.error('Seed failed:', err.message);
  }
  finally {
    await pool.end();
  }
}

seed();
