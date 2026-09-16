const db = require('./backend/db');

console.log('Fixing attendance schema...\n');

// Step 1: Drop the old attendance table (if it exists)
db.query('DROP TABLE IF EXISTS `attendance`', (err) => {
  if (err) {
    console.error('❌ Error dropping old attendance table:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Dropped old attendance table (if it existed)');
  
  // Step 2: Create the new attendance table with proper schema
  const createTableSQL = `
    CREATE TABLE \`attendance\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`attendance_id\` varchar(50) NOT NULL COMMENT 'Unique attendance record ID',
      \`person_type\` varchar(20) NOT NULL COMMENT 'student, employee',
      \`student_id\` varchar(50),
      \`employee_id\` varchar(50),
      \`person_name\` varchar(100),
      \`department_id\` int(11),
      \`department_name\` varchar(100),
      \`attendance_date\` date NOT NULL,
      \`check_in_time\` time,
      \`check_out_time\` time,
      \`attendance_status\` varchar(50) DEFAULT 'present' COMMENT 'Present, Late, Absent, Excused, Early Leave, Checked In, Checked Out',
      \`campus\` varchar(100),
      \`location\` varchar(100) COMMENT 'Building, Gate, etc.',
      \`device_id\` varchar(50),
      \`verification_method\` varchar(50) COMMENT 'QR, Smart Card, Manual Admin Entry, Biometric',
      \`working_duration\` time COMMENT 'Calculated for employees (Check Out - Check In)',
      \`notes\` text,
      \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_attendance_id\` (\`attendance_id\`),
      KEY \`idx_person_type\` (\`person_type\`),
      KEY \`idx_student_id\` (\`student_id\`),
      KEY \`idx_employee_id\` (\`employee_id\`),
      KEY \`idx_attendance_date\` (\`attendance_date\`),
      KEY \`idx_attendance_status\` (\`attendance_status\`),
      KEY \`idx_department_id\` (\`department_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Error creating new attendance table:', err.message);
      process.exit(1);
    }
    
    console.log('✓ Created new attendance table with proper schema');
    console.log('\nAttendance table schema:');
    console.log('  - id (INT, PRIMARY KEY)');
    console.log('  - attendance_id (VARCHAR 50, UNIQUE)');
    console.log('  - person_type (VARCHAR 20): student | employee');
    console.log('  - student_id (VARCHAR 50)');
    console.log('  - employee_id (VARCHAR 50)');
    console.log('  - person_name (VARCHAR 100)');
    console.log('  - department_id (INT)');
    console.log('  - department_name (VARCHAR 100)');
    console.log('  - attendance_date (DATE)');
    console.log('  - check_in_time (TIME)');
    console.log('  - check_out_time (TIME)');
    console.log('  - attendance_status (VARCHAR 50)');
    console.log('  - campus (VARCHAR 100)');
    console.log('  - location (VARCHAR 100)');
    console.log('  - device_id (VARCHAR 50)');
    console.log('  - verification_method (VARCHAR 50)');
    console.log('  - working_duration (TIME)');
    console.log('  - notes (TEXT)');
    console.log('  - created_at (TIMESTAMP)');
    console.log('  - updated_at (TIMESTAMP)');
    
    console.log('\n✅ Schema fix complete!');
    process.exit(0);
  });
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Timeout');
  process.exit(1);
}, 10000);
