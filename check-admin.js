const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SMS',
  user: 'postgres',
  password: 'Kishan8051'
});

async function checkAdmin() {
  try {
    const result = await pool.query("SELECT email, role, is_active FROM users WHERE role = 'admin'");
    console.log('Admin users:', result.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdmin();
