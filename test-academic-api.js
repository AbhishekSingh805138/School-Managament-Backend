const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testAcademicYearsAPI() {
  try {
    // First, let's try without authentication
    console.log('Testing academic years API without auth...');
    try {
      const response = await axios.get(`${API_URL}/academic-years`);
      console.log('✅ Success without auth!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Failed without auth:', error.response?.status, error.response?.data?.message);
      
      // Now try with authentication
      console.log('\nTrying with authentication...');
      console.log('Please provide login credentials:');
      console.log('Using: admin@school.com / admin123');
      
      // Try to login first
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: 'admin@school.com',
          password: 'admin123'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful!');
        
        // Now try academic years with token
        const academicResponse = await axios.get(`${API_URL}/academic-years`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Academic years fetched successfully!');
        console.log('Response:', JSON.stringify(academicResponse.data, null, 2));
        
      } catch (loginError) {
        console.log('❌ Login failed:', loginError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAcademicYearsAPI();
