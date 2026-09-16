// Debug script to check what's in employee_attendance_records table

const db = require('./db');

console.log('🔍 Checking employee_attendance_records table...\n');

// Check if table exists
db.query('SHOW TABLES LIKE "employee_attendance_records"', (err, tables) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }

  if (tables.length === 0) {
    console.log('❌ Table employee_attendance_records does not exist!');
    process.exit(1);
  }

  console.log('✅ Table exists\n');

  // Get table structure
  console.log('📋 Table Structure:');
  console.log('═'.repeat(80));
  db.query('DESCRIBE employee_attendance_records', (err, columns) => {
    if (err) {
      console.error('❌ Error:', err);
      process.exit(1);
    }

    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | Null: ${col.Null}`);
    });
    console.log('═'.repeat(80));

    // Count total records
    db.query('SELECT COUNT(*) as total FROM employee_attendance_records', (err, count) => {
      if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
      }

      console.log(`\n📊 Total Records: ${count[0].total}\n`);

      if (count[0].total === 0) {
        console.log('⚠️  No records found in the table.');
        console.log('   Mark some attendance and run this script again.\n');
        db.end();
        process.exit(0);
      }

      // Get sample records
      console.log('📝 Sample Records (Last 10):');
      console.log('═'.repeat(120));
      
      const query = `
        SELECT 
          id,
          employee_id,
          employee_name,
          employee_type,
          department,
          attendance_type,
          scan_date,
          scan_time,
          status
        FROM employee_attendance_records
        ORDER BY id DESC
        LIMIT 10
      `;

      db.query(query, (err, records) => {
        if (err) {
          console.error('❌ Error:', err);
          process.exit(1);
        }

        if (records.length === 0) {
          console.log('No records found');
        } else {
          records.forEach(rec => {
            console.log(`ID: ${rec.id}`);
            console.log(`  Employee: ${rec.employee_name} (${rec.employee_id})`);
            console.log(`  Type: ${rec.employee_type || 'NULL'}`);
            console.log(`  Department: ${rec.department || 'NULL'}`);
            console.log(`  Attendance: ${rec.attendance_type} on ${rec.scan_date} at ${rec.scan_time}`);
            console.log(`  Status: ${rec.status}`);
            console.log('─'.repeat(120));
          });
        }

        // Group by employee_type
        console.log('\n📊 Records by Employee Type:');
        console.log('═'.repeat(80));
        
        db.query(`
          SELECT 
            COALESCE(employee_type, 'NULL/Unassigned') as staff_type,
            COUNT(*) as count
          FROM employee_attendance_records
          GROUP BY employee_type
          ORDER BY count DESC
        `, (err, groups) => {
          if (err) {
            console.error('❌ Error:', err);
            process.exit(1);
          }

          groups.forEach(g => {
            console.log(`${g.staff_type.padEnd(40)} : ${g.count} records`);
          });
          console.log('═'.repeat(80));

          // Check today's records
          console.log('\n📅 Today\'s Records:');
          console.log('═'.repeat(80));
          
          const today = new Date().toISOString().split('T')[0];
          
          db.query(`
            SELECT 
              employee_id,
              employee_name,
              employee_type,
              attendance_type,
              scan_time
            FROM employee_attendance_records
            WHERE DATE(scan_date) = DATE(?)
            ORDER BY scan_time DESC
          `, [today], (err, todayRecords) => {
            if (err) {
              console.error('❌ Error:', err);
              process.exit(1);
            }

            console.log(`Date: ${today}`);
            console.log(`Total: ${todayRecords.length} records\n`);

            if (todayRecords.length === 0) {
              console.log('⚠️  No records for today');
            } else {
              todayRecords.forEach(rec => {
                console.log(`${rec.scan_time} | ${rec.employee_name.padEnd(25)} | ${(rec.employee_type || 'NULL').padEnd(20)} | ${rec.attendance_type}`);
              });
            }
            console.log('═'.repeat(80));

            console.log('\n✅ Check complete!\n');
            db.end();
            process.exit(0);
          });
        });
      });
    });
  });
});
