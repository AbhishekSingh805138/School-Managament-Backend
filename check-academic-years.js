const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SMS',
  user: 'postgres',
  password: 'Kishan8051'
});

async function checkAcademicYears() {
  try {
    const result = await pool.query('SELECT * FROM academic_years ORDER BY created_at DESC');
    console.log(`Found ${result.rows.length} academic years:`);
    console.log(result.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAcademicYears();
