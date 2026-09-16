// Update NULL employee_type values in employee_attendance_records
// by fetching from employees table

const db = require('./db');

console.log('🔄 Updating NULL employee_type values...\n');

// First, count how many NULL records exist
db.query(`
  SELECT COUNT(*) as count 
  FROM employee_attendance_records 
  WHERE employee_type IS NULL OR employee_type = ''
`, (err, result) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  const nullCount = result[0].count;
  console.log(`📊 Found ${nullCount} records with NULL/empty employee_type\n`);

  if (nullCount === 0) {
    console.log('✅ No NULL records to update. All done!');
    process.exit(0);
  }

  // Update NULL records by joining with employees table
  const updateQuery = `
    UPDATE employee_attendance_records ear
    INNER JOIN employees e ON ear.employee_id = e.employee_id
    SET ear.employee_type = COALESCE(e.employee_type, 'Unassigned')
    WHERE ear.employee_type IS NULL OR ear.employee_type = ''
  `;

  console.log('🔄 Updating records...');

  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error('❌ Update error:', err);
      process.exit(1);
    }

    console.log(`✅ Updated ${result.affectedRows} records\n`);

    // Verify the update
    console.log('📊 Verification - Records by Employee Type:');
    console.log('═'.repeat(80));
    
    db.query(`
      SELECT 
        COALESCE(employee_type, 'NULL') as staff_type,
        COUNT(*) as count
      FROM employee_attendance_records
      GROUP BY employee_type
      ORDER BY count DESC
    `, (err, groups) => {
      if (err) {
        console.error('❌ Verification error:', err);
        process.exit(1);
      }

      groups.forEach(g => {
        console.log(`${g.staff_type.padEnd(40)} : ${g.count} records`);
      });
      console.log('═'.repeat(80));

      console.log('\n✅ Update complete!');
      console.log('\n📝 Next steps:');
      console.log('   1. Restart your backend server');
      console.log('   2. Refresh the frontend (Ctrl+Shift+R)');
      console.log('   3. Go to VIEW ATTENDANCE tab');
      console.log('   4. Click "CLEAR FILTERS" then "APPLY FILTERS"');
      console.log('   5. Records should now appear under correct staff types!\n');
      
      process.exit(0);
    });
  });
});
