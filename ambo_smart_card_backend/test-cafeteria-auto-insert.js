const http = require('http');

// Test data - using a fresh student that hasn't been tested yet
const testPayload = { student_id: '2026-8042' };
const postData = JSON.stringify(testPayload);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/attendance/mark',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending attendance mark request...');
console.log('Payload:', testPayload);
console.log('Endpoint: POST http://localhost:5000/api/attendance/mark\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Response:', data);
    }
    
    // Now check if it was inserted into cafeteria_attendance
    setTimeout(() => {
      checkCafeteriaData();
    }, 500);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();

// Function to check if data was inserted into cafeteria_attendance
function checkCafeteriaData() {
  const db = require('./backend/db');
  const today = new Date().toISOString().split('T')[0];
  
  console.log('\n--- Checking cafeteria_attendance table ---');
  console.log('Looking for records from today:', today);
  
  db.query(
    `SELECT * FROM cafeteria_attendance WHERE student_id = ? AND attendance_date = ? ORDER BY created_at DESC`,
    ['2026-8042', today],
    (err, results) => {
      if (err) {
        console.error('Query error:', err);
        process.exit(1);
      }
      
      if (!results || results.length === 0) {
        console.log('✗ No cafeteria records found for 2026-8042 today');
      } else {
        console.log(`✓ Found ${results.length} cafeteria record(s):`);
        results.forEach((record, idx) => {
          console.log(`\n[${idx + 1}]`);
          console.log('  - Attendance ID:', record.attendance_id);
          console.log('  - Student ID:', record.student_id);
          console.log('  - Student Name:', record.student_name);
          console.log('  - Meal Type:', record.meal_type);
          console.log('  - Attendance Date:', record.attendance_date);
          console.log('  - Scan Time:', record.scan_time);
          console.log('  - Status:', record.attendance_status);
          console.log('  - Created:', record.created_at);
        });
      }
      
      process.exit(0);
    }
  );
}
