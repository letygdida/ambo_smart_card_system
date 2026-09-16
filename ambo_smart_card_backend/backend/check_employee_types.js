// Check employee_type values in employees table

const db = require('./db');

console.log('🔍 Checking employee_type values in employees table...\n');

// Get all employees with their attendance records
const query = `
  SELECT DISTINCT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.employee_type,
    COUNT(ear.id) as attendance_count
  FROM employees e
  LEFT JOIN employee_attendance_records ear ON e.employee_id = ear.employee_id
  GROUP BY e.employee_id, e.first_name, e.last_name, e.employee_type
  ORDER BY e.employee_type, e.employee_id
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  console.log('📋 Employees and Their Types:');
  console.log('═'.repeat(100));
  console.log('Employee ID'.padEnd(20), 'Name'.padEnd(30), 'Type'.padEnd(25), 'Attendance Records');
  console.log('═'.repeat(100));

  let nullCount = 0;
  let withTypeCount = 0;

  results.forEach(emp => {
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
    const type = emp.employee_type || 'NULL';
    
    if (!emp.employee_type) {
      nullCount++;
      console.log(emp.employee_id.padEnd(20), name.padEnd(30), `❌ ${type}`.padEnd(25), emp.attendance_count);
    } else {
      withTypeCount++;
      console.log(emp.employee_id.padEnd(20), name.padEnd(30), `✅ ${type}`.padEnd(25), emp.attendance_count);
    }
  });

  console.log('═'.repeat(100));
  console.log(`\n📊 Summary:`);
  console.log(`   Employees with employee_type: ${withTypeCount}`);
  console.log(`   Employees with NULL employee_type: ${nullCount}`);
  console.log(`   Total: ${results.length}`);

  // Group by type
  console.log('\n📊 Employees by Type:');
  console.log('═'.repeat(80));
  
  db.query(`
    SELECT 
      COALESCE(employee_type, 'NULL') as type,
      COUNT(*) as count
    FROM employees
    GROUP BY employee_type
    ORDER BY count DESC
  `, (err, groups) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }

    groups.forEach(g => {
      console.log(`${g.type.padEnd(40)} : ${g.count} employees`);
    });
    console.log('═'.repeat(80));

    console.log('\n✅ Check complete!\n');
    process.exit(0);
  });
});
