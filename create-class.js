const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SMS',
  user: 'postgres',
  password: 'Kishan8051'
});

async function createClass() {
  try {
    console.log('Creating sample class...');
    
    // First, check if we have an academic year
    const academicYearQuery = 'SELECT * FROM academic_years ORDER BY created_at DESC LIMIT 1';
    const academicYearResult = await pool.query(academicYearQuery);
    
    let academicYearId;
    if (academicYearResult.rows.length === 0) {
      // Create an academic year first
      console.log('No academic year found. Creating one...');
      const createAcademicYearQuery = `
        INSERT INTO academic_years (name, start_date, end_date, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const academicYearValues = [
        '2024-2025',
        '2024-04-01',
        '2025-03-31',
        true
      ];
      const newAcademicYear = await pool.query(createAcademicYearQuery, academicYearValues);
      academicYearId = newAcademicYear.rows[0].id;
      console.log('✅ Academic year created:', newAcademicYear.rows[0]);
    } else {
      academicYearId = academicYearResult.rows[0].id;
      console.log('✅ Using existing academic year:', academicYearResult.rows[0]);
    }
    
    // Check if class already exists
    const checkQuery = 'SELECT * FROM classes WHERE name = $1 AND section = $2';
    const checkResult = await pool.query(checkQuery, ['Grade 10', 'A']);
    
    if (checkResult.rows.length > 0) {
      console.log('❌ Class already exists!');
      console.log('Existing class:', checkResult.rows[0]);
    } else {
      // Get a teacher to assign (or use admin as fallback)
      const teacherQuery = 'SELECT id FROM users WHERE role IN (\'teacher\', \'admin\') LIMIT 1';
      const teacherResult = await pool.query(teacherQuery);
      
      if (teacherResult.rows.length === 0) {
        console.log('❌ No teacher or admin found. Please create a teacher first.');
        return;
      }
      
      const teacherId = teacherResult.rows[0].id;
      
      // Insert new class
      const insertQuery = `
        INSERT INTO classes (name, grade, section, teacher_id, academic_year_id, capacity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        'Grade 10',
        '10',
        'A',
        teacherId,
        academicYearId,
        40,
        true
      ];
      
      const result = await pool.query(insertQuery, values);
      console.log('✅ Class created successfully!');
      console.log('Class details:', result.rows[0]);
    }
    
    // Get a teacher to assign (or use admin as fallback)
    const teacherQuery = 'SELECT id FROM users WHERE role IN (\'teacher\', \'admin\') LIMIT 1';
    const teacherResult = await pool.query(teacherQuery);
    const teacherId = teacherResult.rows[0].id;
    
    // Create a few more sample classes
    const sampleClasses = [
      { name: 'Grade 10', grade: '10', section: 'B', capacity: 40 },
      { name: 'Grade 9', grade: '9', section: 'A', capacity: 35 },
      { name: 'Grade 9', grade: '9', section: 'B', capacity: 35 },
    ];
    
    for (const classData of sampleClasses) {
      const checkResult = await pool.query(checkQuery, [classData.name, classData.section]);
      if (checkResult.rows.length === 0) {
        const insertQuery = `
          INSERT INTO classes (name, grade, section, teacher_id, academic_year_id, capacity, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        const values = [classData.name, classData.grade, classData.section, teacherId, academicYearId, classData.capacity, true];
        const result = await pool.query(insertQuery, values);
        console.log(`✅ Created class: ${classData.name} - ${classData.section}`);
      }
    }
    
    console.log('');
    console.log('📝 Sample classes created successfully!');
    console.log('   You can now assign students to these classes.');
    
  } catch (error) {
    console.error('❌ Error creating class:', error);
  } finally {
    await pool.end();
  }
}

createClass();
