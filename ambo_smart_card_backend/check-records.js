const db = require('./backend/db');

console.log('Checking database records for student 2026-4828...\n');

// First, check attendance table
console.log('=== ATTENDANCE TABLE ===');
db.query(
  `SELECT id, attendance_id, student_id, person_name, attendance_date, check_in_time, attendance_status, created_at
   FROM attendance 
   WHERE student_id = '2026-4828' AND DATE(attendance_date) = CURDATE()
   ORDER BY created_at DESC`,
  [],
  (err, results) => {
    if (err) {
      console.error('Attendance query error:', err);
    } else {
      console.log(`Found ${results.length} attendance record(s):`);
      results.forEach((r, i) => {
        console.log(`  [${i+1}] ID: ${r.attendance_id}, Time: ${r.check_in_time}, Status: ${r.attendance_status}`);
      });
    }
    
    // Then check cafeteria table
    console.log('\n=== CAFETERIA_ATTENDANCE TABLE ===');
    db.query(
      `SELECT id, attendance_id, student_id, student_name, meal_type, attendance_date, scan_time, attendance_status, created_at
       FROM cafeteria_attendance 
       WHERE student_id = '2026-4828' AND DATE(attendance_date) = CURDATE()
       ORDER BY created_at DESC`,
      [],
      (err2, results2) => {
        if (err2) {
          console.error('Cafeteria query error:', err2);
        } else {
          console.log(`Found ${results2.length} cafeteria record(s):`);
          results2.forEach((r, i) => {
            console.log(`  [${i+1}] ID: ${r.attendance_id}, Meal: ${r.meal_type}, Time: ${r.scan_time}, Status: ${r.attendance_status}`);
          });
        }
        
        // Show meal times
        console.log('\n=== MEAL_TIMES_CONFIG ===');
        db.query('SELECT meal_type, start_time, end_time, is_active FROM meal_times_config', [], (err3, results3) => {
          console.log('Active meals:');
          results3.forEach(m => {
            console.log(`  ${m.meal_type}: ${m.start_time} - ${m.end_time} (active: ${m.is_active})`);
          });
          
          // Show current server time
          console.log('\n=== SERVER TIME ===');
          db.query('SELECT NOW() as current_time, CURTIME() as current_time_only', [], (err4, results4) => {
            console.log(`Server time: ${results4[0].current_time}`);
            console.log(`Time only: ${results4[0].current_time_only}`);
            
            process.exit(0);
          });
        });
      }
    );
  }
);
