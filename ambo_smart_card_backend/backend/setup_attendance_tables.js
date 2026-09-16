const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupTables() {
  console.log('====================================================================');
  console.log('CREATING ATTENDANCE CONTROL TABLES');
  console.log('====================================================================\n');

  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ambo_smart_card',
      multipleStatements: true
    });

    console.log('✓ Connected to MySQL database: ambo_smart_card\n');

    // Read SQL file (simplified version without stored procedures)
    const sqlPath = path.join(__dirname, 'sql', 'employee_attendance_control_simple.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('✓ Read SQL migration file\n');
    console.log('Executing SQL statements...\n');

    // Execute SQL
    await connection.query(sql);

    console.log('✅ SUCCESS! All tables created:\n');
    console.log('  ✓ employee_attendance_control');
    console.log('  ✓ employee_attendance_control_logs');
    console.log('  ✓ employee_attendance_records\n');

    // Verify tables exist
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'employee_attendance%'"
    );

    console.log('Verification - Tables found:');
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  ✓ ${tableName}`);
    });

    await connection.end();

    console.log('\n====================================================================');
    console.log('✅ SETUP COMPLETE!');
    console.log('====================================================================\n');
    console.log('Next steps:');
    console.log('1. Your backend should already be running (keep it running)');
    console.log('2. Go to: http://localhost:3001/employee-attendance');
    console.log('3. Press Ctrl+F5 to refresh the browser');
    console.log('4. Click "ATTENDANCE CONTROL" tab');
    console.log('5. You should now be able to configure attendance!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Make sure database "ambo_smart_card" exists');
    console.error('3. Check MySQL credentials in backend/db.js');
    console.error('4. If you have a MySQL password, edit this script and add it\n');
    process.exit(1);
  }
}

setupTables();
