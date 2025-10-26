const jwt = require('jsonwebtoken');

// Test JWT generation and verification
const JWT_SECRET = 'your_super_secret_jwt_key_change_this_in_production_environment_32_chars_minimum';

const payload = {
  id: '123',
  email: 'test@example.com',
  role: 'admin'
};

console.log('JWT_SECRET length:', JWT_SECRET.length);
console.log('JWT_SECRET:', JWT_SECRET);

try {
  // Generate token
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  console.log('Generated token:', token);

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded token:', decoded);
  
  console.log('JWT working correctly!');
} catch (error) {
  console.error('JWT Error:', error.message);
}