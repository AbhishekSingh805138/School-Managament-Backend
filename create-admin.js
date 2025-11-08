const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SMS',
  user: 'postgres',
  password: 'Kishan8051'
});

async function createAdminUser() {
  try {
    // Hash the password
    const password = 'admin123'; // Change this to your desired password
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('Creating admin user...');
    console.log('Email: admin@school.com');
    console.log('Password: admin123');
    console.log('');
    
    // Check if admin already exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, ['admin@school.com']);
    
    if (checkResult.rows.length > 0) {
      console.log('❌ Admin user already exists!');
      console.log('Existing admin:', checkResult.rows[0]);
      
      // Update password if needed
      const updateQuery = 'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING *';
      const updateResult = await pool.query(updateQuery, [passwordHash, 'admin@school.com']);
      console.log('✅ Admin password updated!');
      console.log('Updated admin:', updateResult.rows[0]);
    } else {
      // Insert new admin user
      const insertQuery = `
        INSERT INTO users (first_name, last_name, email, password_hash, role, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        'Admin',
        'User',
        'admin@school.com',
        passwordHash,
        'admin',
        '1234567890',
        true
      ];
      
      const result = await pool.query(insertQuery, values);
      console.log('✅ Admin user created successfully!');
      console.log('Admin details:', result.rows[0]);
    }
    
    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Email: admin@school.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
