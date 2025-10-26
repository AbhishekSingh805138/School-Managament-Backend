// Set environment variables first
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'SMS';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'Kishan8051';

const request = require('supertest');
const app = require('./dist/app.js').default;

async function testSemesterAPI() {
  console.log('=== Semester API Test ===');
  
  try {
    // Step 1: Register admin and get token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'Admin',
        email: `testadmin${Date.now()}@example.com`,
        password: 'TestPass123!',
        role: 'admin'
      });
    
    if (registerResponse.status !== 201) {
      console.log('❌ Registration failed:', registerResponse.body);
      return;
    }
    
    const token = registerResponse.body.data.token;
    console.log('✅ Admin registered successfully');
    
    // Step 2: Get existing academic year
    const academicYearsResponse = await request(app)
      .get('/api/v1/academic-years')
      .set('Authorization', `Bearer ${token}`);
    
    if (academicYearsResponse.status !== 200 || academicYearsResponse.body.data.length === 0) {
      console.log('❌ No academic years found');
      return;
    }
    
    const academicYearId = academicYearsResponse.body.data[0].id;
    console.log('✅ Found academic year:', academicYearId);
    
    // Step 3: Test Semester creation
    console.log('\n2. Testing Semester creation...');
    const semesterData = {
      academicYearId: academicYearId,
      name: `Test-Semester-${Date.now()}`,
      startDate: '2024-09-01',
      endDate: '2024-12-31',
      isActive: true
    };
    
    const createResponse = await request(app)
      .post('/api/v1/semesters')
      .set('Authorization', `Bearer ${token}`)
      .send(semesterData);
    
    console.log('Create Semester status:', createResponse.status);
    console.log('Create Semester response:', createResponse.body);
    
    if (createResponse.status === 201) {
      console.log('✅ Semester creation successful!');
      
      // Step 4: Test getting semesters
      console.log('\n3. Testing get semesters...');
      const getResponse = await request(app)
        .get('/api/v1/semesters')
        .set('Authorization', `Bearer ${token}`);
      
      console.log('Get Semesters status:', getResponse.status);
      
      if (getResponse.status === 200) {
        console.log('✅ Semester API is working correctly!');
      } else {
        console.log('❌ Get Semesters failed:', getResponse.body);
      }
    } else {
      console.log('❌ Semester creation failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSemesterAPI();