const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testLogin() {
  try {
    console.log('Testing login with admin@school.com...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@school.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.data.token);
    console.log('User:', response.data.data.user);
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    
    // Try with different password
    console.log('\nTrying with different passwords...');
    const passwords = ['Admin@123', 'admin@123', 'Admin123', 'password'];
    
    for (const pwd of passwords) {
      try {
        console.log(`Trying password: ${pwd}`);
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: 'admin@school.com',
          password: pwd
        });
        console.log(`✅ Success with password: ${pwd}`);
        console.log('Token:', response.data.data.token);
        return;
      } catch (e) {
        console.log(`❌ Failed with password: ${pwd}`);
      }
    }
  }
}

testLogin();
