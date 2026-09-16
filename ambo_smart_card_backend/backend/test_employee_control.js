const db = require('./db');

console.log('🔍 Testing Employee Attendance Control Setup...\n');

// Check if table exists
db.query(`SHOW TABLES LIKE 'employee_attendance_control'`, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  if (results.length === 0) {
    console.log('❌ Table employee_attendance_control does NOT exist!');
    console.log('\n📋 Solution: Run SETUP_ATTENDANCE_CONTROL.bat to create the table\n');
    process.exit(1);
  }

  console.log('✅ Table employee_attendance_control exists\n');

  // Check if records exist
  db.query(`SELECT * FROM employee_attendance_control WHERE is_active = TRUE`, (err, records) => {
    if (err) {
      console.error('❌ Query error:', err);
      process.exit(1);
    }

    console.log(`📊 Found ${records.length} active control records:\n`);

    if (records.length === 0) {
      console.log('⚠️  No active control records found!');
      console.log('\n📋 Creating default control records...\n');

      const defaultRecords = [
        ['check-in', 'manual', 1, '08:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Check-in control'],
        ['check-out', 'manual', 1, '08:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Check-out control'],
        ['break-start', 'manual', 1, '08:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Break start control'],
        ['break-end', 'manual', 1, '08:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', 'Break end control']
      ];

      let completed = 0;

      defaultRecords.forEach(record => {
        const [type, mode, isOpen, start, end, days, desc] = record;

        db.query(
          `INSERT INTO employee_attendance_control 
           (attendance_type, control_mode, is_open, auto_start_time, auto_end_time, active_days, is_active, description, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, NOW(), NOW())`,
          [type, mode, isOpen, start, end, days, desc],
          (err) => {
            if (err) {
              console.error(`❌ Error creating ${type} record:`, err);
            } else {
              console.log(`✅ Created ${type} control record`);
            }

            completed++;
            if (completed === defaultRecords.length) {
              console.log('\n✅ All default records created!');
              console.log('🔄 Please refresh the browser\n');
              process.exit(0);
            }
          }
        );
      });

    } else {
      records.forEach(record => {
        console.log(`  - ${record.attendance_type}: ${record.control_mode} mode, is_open=${record.is_open}`);
      });
      console.log('\n✅ Control system is configured correctly!\n');
      process.exit(0);
    }
  });
});
