// Fix employee_type column in employee_attendance_records table
// Changes ENUM to VARCHAR to support all staff types

const db = require('./db');

console.log('🔧 Starting employee_type column migration...\n');

// Step 1: Check if employee_attendance_records table exists
db.query('SHOW TABLES LIKE "employee_attendance_records"', (err, results) => {
  if (err) {
    console.error('❌ Error checking table:', err);
    process.exit(1);
  }

  if (results.length === 0) {
    console.log('⚠️  Table employee_attendance_records does not exist.');
    console.log('   Run SETUP_ATTENDANCE_CONTROL.bat first to create the table.');
    process.exit(0);
  }

  console.log('✅ Table employee_attendance_records exists');

  // Step 2: Check current column definition
  db.query('SHOW COLUMNS FROM employee_attendance_records LIKE "employee_type"', (err, columns) => {
    if (err) {
      console.error('❌ Error checking column:', err);
      process.exit(1);
    }

    if (columns.length > 0) {
      console.log('📋 Current employee_type column definition:');
      console.log('   Type:', columns[0].Type);
      console.log('   Null:', columns[0].Null);
      console.log('   Default:', columns[0].Default);
    }

    // Step 3: Alter the column to VARCHAR(100)
    console.log('\n🔄 Altering employee_type column to VARCHAR(100)...');
    
    const alterQuery = `
      ALTER TABLE employee_attendance_records 
      MODIFY COLUMN employee_type VARCHAR(100) NULL 
      COMMENT 'Staff type: Academic Staff, Administrative Staff, Technical Staff, Support Staff, Security Staff, Management, etc.'
    `;

    db.query(alterQuery, (err, result) => {
      if (err) {
        console.error('❌ Error altering column:', err);
        process.exit(1);
      }

      console.log('✅ Successfully altered employee_type column to VARCHAR(100)');

      // Step 4: Add position column if it doesn't exist
      console.log('\n🔄 Adding position column if it doesn\'t exist...');
      
      const addPositionQuery = `
        ALTER TABLE employee_attendance_records 
        ADD COLUMN IF NOT EXISTS position VARCHAR(255) NULL 
        COMMENT 'Employee position/title'
        AFTER campus
      `;

      db.query(addPositionQuery, (err, result) => {
        if (err) {
          console.error('⚠️  Position column may already exist or error occurred:', err.message);
        } else {
          console.log('✅ Position column added/verified');
        }

        // Step 5: Add index on employee_type
        console.log('\n🔄 Adding index on employee_type...');
        
        db.query('SHOW INDEX FROM employee_attendance_records WHERE Key_name = "idx_employee_type"', (err, indexes) => {
          if (err) {
            console.error('⚠️  Error checking index:', err);
          }

          if (indexes && indexes.length === 0) {
            db.query('ALTER TABLE employee_attendance_records ADD INDEX idx_employee_type (employee_type)', (err) => {
              if (err) {
                console.error('⚠️  Could not add index:', err.message);
              } else {
                console.log('✅ Index idx_employee_type added');
              }
              
              // Final verification
              verifyAndExit();
            });
          } else {
            console.log('✅ Index idx_employee_type already exists');
            verifyAndExit();
          }
        });
      });
    });
  });
});

function verifyAndExit() {
  console.log('\n📊 Verifying final structure...');
  
  db.query('SHOW COLUMNS FROM employee_attendance_records', (err, columns) => {
    if (err) {
      console.error('❌ Error verifying structure:', err);
      process.exit(1);
    }

    console.log('\n✅ Final employee_attendance_records structure:');
    console.log('═'.repeat(80));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key.padEnd(5)}`);
    });
    console.log('═'.repeat(80));

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test marking employee attendance');
    console.log('   3. Check that records appear under correct staff type in "View Attendance" tab');
    
    db.end();
    process.exit(0);
  });
}
