const db = require('./db');

console.log('🔍 Checking latest attendance records for addis tedesa...\n');

// Check employee_attendance_records table
db.query(`
  SELECT 
    id,
    employee_id,
    employee_name,
    employee_type,
    department,
    attendance_type,
    scan_date,
    scan_time,
    status,
    created_at
  FROM employee_attendance_records
  WHERE employee_name LIKE '%addis%' OR employee_id = 'AU-EMP-2026-0015'
  ORDER BY created_at DESC
  LIMIT 5
`, (err, results) => {
  if (err) {
    console.error('❌ Query error:', err);
    process.exit(1);
  }

  console.log(`✅ Found ${results.length} records for addis tedesa in employee_attendance_records:\n`);
  
  if (results.length === 0) {
    console.log('⚠️  NO RECORDS FOUND - Attendance was NOT saved to database!');
  } else {
    results.forEach(record => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`ID: ${record.id}`);
      console.log(`Employee: ${record.employee_name} (${record.employee_id})`);
      console.log(`Type: ${record.employee_type}`);
      console.log(`Department: ${record.department}`);
      console.log(`Attendance: ${record.attendance_type} on ${record.scan_date} at ${record.scan_time}`);
      console.log(`Status: ${record.status}`);
      console.log(`Created: ${record.created_at}`);
    });
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Also check employees table to see if employee exists
  db.query(`
    SELECT 
      employee_id,
      first_name,
      last_name,
      employee_type,
      department_name,
      position
    FROM employees
    WHERE employee_id = 'AU-EMP-2026-0015'
  `, (err2, empResults) => {
    if (err2) {
      console.error('❌ Employee query error:', err2);
      process.exit(1);
    }

    console.log('📋 Employee details from employees table:\n');
    
    if (empResults.length === 0) {
      console.log('❌ Employee AU-EMP-2026-0015 NOT FOUND in employees table!');
    } else {
      const emp = empResults[0];
      console.log(`Name: ${emp.first_name} ${emp.last_name}`);
      console.log(`ID: ${emp.employee_id}`);
      console.log(`Type: ${emp.employee_type}`);
      console.log(`Department: ${emp.department_name}`);
      console.log(`Position: ${emp.position}`);
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  });
});
