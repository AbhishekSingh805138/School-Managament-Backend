const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Login credentials (use your admin account)
const loginData = {
  email: 'admin@school.com',
  password: 'admin123'
};

async function createAcademicYear() {
  try {
    // Step 1: Login to get token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.token;
    console.log('Login successful!');

    // Step 2: Create academic year
    console.log('\nCreating academic year...');
    const academicYearData = {
      name: '2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-06-30',
      isActive: true
    };

    const academicYearResponse = await axios.post(
      `${API_URL}/academic-years`,
      academicYearData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Academic year created successfully!');
    console.log('Academic Year:', academicYearResponse.data.data);

    // Step 3: Create another academic year for next year
    console.log('\nCreating another academic year...');
    const academicYearData2 = {
      name: '2025-2026',
      startDate: '2025-09-01',
      endDate: '2026-06-30',
      isActive: false
    };

    const academicYearResponse2 = await axios.post(
      `${API_URL}/academic-years`,
      academicYearData2,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Second academic year created successfully!');
    console.log('Academic Year:', academicYearResponse2.data.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createAcademicYear();
