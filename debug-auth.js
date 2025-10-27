const jwt = require('jsonwebtoken');

// Test JWT secret from setup
const JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-jwt-validation';

// Create a test token like the tests do
const testToken = jwt.sign(
  { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated test token:', testToken);

// Verify the token
try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('Decoded token:', decoded);
} catch (error) {
  console.error('Token verification failed:', error.message);
}

// Test what the auth service would generate
const authServiceToken = jwt.sign(
  { id: 'some-uuid', email: 'admin@test.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '15m' }
);

console.log('Auth service style token:', authServiceToken);

try {
  const decoded2 = jwt.verify(authServiceToken, JWT_SECRET);
  console.log('Auth service decoded:', decoded2);
} catch (error) {
  console.error('Auth service token verification failed:', error.message);
}