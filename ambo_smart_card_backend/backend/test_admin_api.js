const http = require('http');
const jwt = require('jsonwebtoken');

// Create a test token for an admin user
const testToken = jwt.sign(
  {
    id: 1,
    username: 'admin',
    role: 'admin',
    student_id: null
  },
  'smartcard_secret',
  { expiresIn: '1h' }
);

console.log('Test token:', testToken);

// Test GET /api/admin/profile
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/profile',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${testToken}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
