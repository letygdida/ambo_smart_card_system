const mysql = require('mysql2');
const http = require('http');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ambo_smart_card'
});

const testStudentId = '2026-4081';

console.log('=== AUTO-INSERT FEATURE TEST ===');
console.log(`Testing with student ID: ${testStudentId}`);

// Step 1: Clear today's records for the test student
const today = new Date().toISOString().split('T')[0];

console.log('\nStep 1: Clearing existing records for today...');

connection.query('DELETE FROM attendance WHERE student_id = ? AND DATE(attendance_date) = ?', 
  [testStudentId, today], 
  (err) => {
    if (err) {
      console.error('Error clearing attendance:', err);
      connection.end();
      return;
    }
    
    connection.query('DELETE FROM cafeteria_attendance WHERE student_id = ? AND DATE(attendance_date) = ?', 
      [testStudentId, today], 
      (err2) => {
        if (err2) {
          console.error('Error clearing cafeteria:', err2);
          connection.end();
          return;
        }
        
        console.log('✓ Records cleared for today');
        
        // Step 2: Mark attendance via API
        console.log('\nStep 2: Making attendance API request...');
        
        const postData = JSON.stringify({ student_id: testStudentId });
        
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
        
        const req = http.request(options, (res) => {
          let data = '';
          
          res.on('data', chunk => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('API Response Status:', res.statusCode);
            try {
              const parsed = JSON.parse(data);
              console.log('API Response:', JSON.stringify(parsed, null, 2));
            } catch (e) {
              console.log('API Response (raw):', data);
            }
            
            // Step 3: Wait a moment, then check both tables
            setTimeout(() => {
              checkResults();
            }, 1000);
          });
        });
        
        req.on('error', (e) => {
          console.error('Request error:', e);
          connection.end();
        });
        
        req.write(postData);
        req.end();
      }
    );
  }
);

function checkResults() {
  console.log('\nStep 3: Checking database results...');
  
  // Check attendance table
  connection.query(
    'SELECT * FROM attendance WHERE student_id = ? AND DATE(attendance_date) = ?',
    [testStudentId, today],
    (err, attendanceResults) => {
      if (err) {
        console.error('Error checking attendance:', err);
      } else {
        console.log(`\n✓ ATTENDANCE TABLE: Found ${attendanceResults.length} record(s)`);
        attendanceResults.forEach(r => {
          console.log(`  - ${r.attendance_id} at ${r.check_in_time} (${r.attendance_status})`);
        });
      }
      
      // Check cafeteria_attendance table
      connection.query(
        'SELECT * FROM cafeteria_attendance WHERE student_id = ? AND DATE(attendance_date) = ?',
        [testStudentId, today],
        (err2, cafeteriaResults) => {
          if (err2) {
            console.error('Error checking cafeteria:', err2);
          } else {
            console.log(`\n✓ CAFETERIA_ATTENDANCE TABLE: Found ${cafeteriaResults.length} record(s)`);
            cafeteriaResults.forEach(r => {
              console.log(`  - ${r.attendance_id} for ${r.meal_type} at ${r.scan_time} (${r.attendance_status})`);
            });
          }
          
          // Summary
          const regularAttendance = attendanceResults ? attendanceResults.length : 0;
          const cafeteriaAttendance = cafeteriaResults ? cafeteriaResults.length : 0;
          
          console.log('\n=== TEST SUMMARY ===');
          console.log(`Regular attendance records: ${regularAttendance}`);
          console.log(`Cafeteria attendance records: ${cafeteriaAttendance}`);
          
          if (regularAttendance > 0 && cafeteriaAttendance > 0) {
            console.log('🎉 SUCCESS: Auto-insert feature is working!');
          } else if (regularAttendance > 0 && cafeteriaAttendance === 0) {
            console.log('❌ PARTIAL: Regular attendance created, but cafeteria auto-insert failed');
          } else {
            console.log('❌ FAILED: No attendance records created');
          }
          
          connection.end();
        }
      );
    }
  );
}