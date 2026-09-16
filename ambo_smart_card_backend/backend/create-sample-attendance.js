const db = require('./db');

console.log('📝 Creating sample cafeteria attendance data...\n');

const today = new Date().toISOString().split('T')[0];
const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}:00`;

// Sample students (these should exist in your users table)
const sampleStudents = [
  { id: '2026-4421', name: 'Yonas Guteta' },
  { id: '2026-8969', name: 'Lensa Guteta Gimdi' },
  { id: '2026-4795', name: 'Sample Student' }
];

// Create attendance for each student for each meal
let recordsCreated = 0;
const totalRecords = sampleStudents.length * 3; // 3 meals per student

sampleStudents.forEach((student, studentIndex) => {
  const meals = ['breakfast', 'lunch', 'dinner'];
  
  meals.forEach((meal, mealIndex) => {
    const attendanceId = `ATT-CAFT-${Date.now()}-${studentIndex}-${mealIndex}`;
    const scanTime = `${String(7 + mealIndex * 4).padStart(2, '0')}:${String(15 + studentIndex * 5).padStart(2, '0')}:00`;
    
    const insertQuery = `
      INSERT INTO cafeteria_attendance 
      (attendance_id, student_id, student_name, meal_type, attendance_date, scan_time, 
       scanner_id, scanner_location, attendance_status, verification_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [
      attendanceId,
      student.id,
      student.name,
      meal,
      today,
      scanTime,
      'CAFT-SCANNER-001',
      'Main Cafeteria',
      'attended',
      'manual'
    ], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ ${student.name} already has ${meal} attendance`);
        } else {
          console.error(`❌ Error creating ${meal} for ${student.name}:`, err.message);
        }
      } else {
        console.log(`✅ Created ${meal} attendance for ${student.name} at ${scanTime}`);
      }
      
      recordsCreated++;
      
      // When all records are processed
      if (recordsCreated >= totalRecords) {
        console.log('\n📊 Sample data creation complete!');
        
        // Show summary
        db.query(
          `SELECT 
             meal_type,
             COUNT(*) as count,
             GROUP_CONCAT(student_name) as students
           FROM cafeteria_attendance 
           WHERE attendance_date = ? 
           GROUP BY meal_type`,
          [today],
          (summaryErr, summaryResults) => {
            if (summaryErr) {
              console.error('❌ Summary error:', summaryErr.message);
            } else {
              console.log('\n📈 Today\'s Attendance Summary:');
              summaryResults.forEach(row => {
                console.log(`  ${row.meal_type}: ${row.count} students (${row.students})`);
              });
            }
            
            console.log('\n🎯 Next Steps:');
            console.log('1. Refresh the Cafeteria Attendance Reports page');
            console.log('2. You should see the attendance records in the table');
            console.log('3. Try the Open/Close buttons to control meal access');
            console.log('4. Test Manual Scan with a student ID');
            
            process.exit(0);
          }
        );
      }
    });
  });
});