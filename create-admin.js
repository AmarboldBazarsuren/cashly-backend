const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'cashly_db',
  password: 'amraa',  // Таны database password
  port: 5432,
});

async function createAdmin() {
  // Simple hash for testing (NOT secure for production!)
  const crypto = require('crypto');
  const password = 'admin123';
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  try {
    await pool.query(
      'INSERT INTO admins (username, password_hash, role, created_at) VALUES ($1, $2, $3, NOW())',
      ['admin', hash, 'super_admin']
    );
    
    console.log('✅ Admin created!');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

createAdmin();