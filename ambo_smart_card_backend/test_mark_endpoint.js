const http = require('http');

console.log('Testing /api/attendance/mark endpoint...');

const body = '{"student_id":"2026-5000"}';
const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/attendance/mark',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});

req.write(body);
req.end();

// Timeout after 5 seconds
setTimeout(() => {
  console.log('Request timed out');
  process.exit(1);
}, 5000);
