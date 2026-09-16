const http = require('http');

console.log('Testing Employee Attendance System\n');
console.log('='.repeat(50));

// Test 1: Get employee types list
console.log('\n1. Testing GET /api/attendance/employee-types-list');
const opts1 = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/attendance/employee-types-list',
  method: 'GET'
};

const req1 = http.request(opts1, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Employee Types:', parsed.employee_types);
      testMarkEmployee();
    } catch (e) {
      console.error('Parse error:', e.message);
      process.exit(1);
    }
  });
});

req1.on('error', e => {
  console.error('Error:', e.message);
  process.exit(1);
});

req1.end();

// Test 2: Mark employee attendance (use a valid employee ID)
function testMarkEmployee() {
  console.log('\n2. Testing POST /api/attendance/mark-employee');
  console.log('   Testing with employee ID: AU-EMP-2026-0001');
  
  const body = JSON.stringify({ employee_id: 'AU-EMP-2026-0001' });
  
  const opts2 = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/attendance/mark-employee',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req2 = http.request(opts2, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        if (res.statusCode === 201) {
          console.log('✓ Employee marked successfully');
          console.log('  Employee:', parsed.employee.full_name);
          console.log('  Type:', parsed.employee.employee_type);
          console.log('  Message:', parsed.message);
        } else {
          console.log('✗ Response:', parsed.message || parsed.error);
        }
      } catch (e) {
        console.error('Parse error:', e.message);
      }
      testGetAttendanceByType();
    });
  });

  req2.on('error', e => {
    console.error('Error:', e.message);
    process.exit(1);
  });

  req2.write(body);
  req2.end();
}

// Test 3: Get attendance grouped by employee type
function testGetAttendanceByType() {
  console.log('\n3. Testing GET /api/attendance/employee-types');
  
  const opts3 = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/attendance/employee-types',
    method: 'GET'
  };

  const req3 = http.request(opts3, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Total records:', parsed.total);
        console.log('Staff types found:', Object.keys(parsed.by_employee_type));
        Object.entries(parsed.by_employee_type).forEach(([type, records]) => {
          console.log(`  - ${type}: ${records.length} records`);
        });
      } catch (e) {
        console.error('Parse error:', e.message);
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('✓ All tests completed');
      process.exit(0);
    });
  });

  req3.on('error', e => {
    console.error('Error:', e.message);
    process.exit(1);
  });

  req3.end();
}

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout');
  process.exit(1);
}, 10000);
