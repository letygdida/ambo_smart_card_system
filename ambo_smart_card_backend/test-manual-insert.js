const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ambo_smart_card'
});

console.log('Testing manual cafeteria insert...');

const today = new Date().toISOString().split('T')[0];
const now = new Date().toTimeString().split(' ')[0];

connection.query(
  `INSERT INTO cafeteria_attendance (
    attendance_id, student_id, student_name, department_id, department_name, 
    meal_type, attendance_date, scan_time, attendance_status, verification_method
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    'TEST-' + Date.now(), '2026-4081', 'Test Student', null, 'Test Dept',
    'dinner', today, now, 'attended', 'manual_test'
  ],
  (err, results) => {
    if (err) {
      console.error('❌ Manual insert failed:', err);
    } else {
      console.log('✅ Manual insert successful');
      console.log('Affected rows:', results.affectedRows);
      console.log('Insert ID:', results.insertId);
    }
    
    connection.end();
  }
);