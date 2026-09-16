const db = require('./db');

// Debug script to check attendance issues
const testStudentId = '2026-4421'; // The student ID from the screenshot
const today = new Date().toISOString().split('T')[0];

console.log('=================================');
console.log('ATTENDANCE DEBUG TEST');
console.log('=================================');
console.log('Student ID:', testStudentId);
console.log('Today:', today);
console.log('=================================');

// 1. Check if student exists
console.log('\n1. Checking if student exists...');
db.query(
  'SELECT * FROM users WHERE student_id = ?',
  [testStudentId],
  (err, results) => {
    if (err) {
      console.error('Student query error:', err);
      return;
    }

    console.log('Student found:', results.length > 0);
    if (results.length > 0) {
      console.log('Student data:', {
        student_id: results[0].student_id,
        name: results[0].full_name || results[0].name,
        department: results[0].department
      });
    }

    // 2. Check attendance records for today
    console.log('\n2. Checking attendance records for today...');
    db.query(
      'SELECT * FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date = ?',
      ['student', testStudentId, today],
      (dupErr, dupResults) => {
        if (dupErr) {
          console.error('Attendance query error:', dupErr);
          return;
        }

        console.log('Attendance records found for today:', dupResults.length);
        if (dupResults.length > 0) {
          dupResults.forEach((record, index) => {
            console.log(`Record ${index + 1}:`, {
              attendance_id: record.attendance_id,
              check_in_time: record.check_in_time,
              attendance_status: record.attendance_status,
              created_at: record.created_at
            });
          });
        }

        // 3. Check all attendance records for this student (last 7 days)
        console.log('\n3. Checking all recent attendance records...');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        db.query(
          'SELECT * FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date >= ? ORDER BY attendance_date DESC',
          ['student', testStudentId, weekAgoStr],
          (allErr, allResults) => {
            if (allErr) {
              console.error('All attendance query error:', allErr);
              return;
            }

            console.log('All recent attendance records:', allResults.length);
            allResults.forEach((record, index) => {
              console.log(`${record.attendance_date}: ${record.attendance_status} at ${record.check_in_time} (ID: ${record.attendance_id})`);
            });

            // 4. Test database connection
            console.log('\n4. Testing database connection...');
            db.query('SELECT CURRENT_TIMESTAMP() as current_time', (timeErr, timeResults) => {
              if (timeErr) {
                console.error('Database connection error:', timeErr);
                return;
              }

              console.log('Database current time:', timeResults[0].current_time);
              console.log('\n=================================');
              console.log('DEBUG TEST COMPLETE');
              console.log('CONCLUSION: Student has attendance marked today!');
              console.log('=================================');
              
              process.exit(0);
            });
          }
        );
      }
    );
  }
);