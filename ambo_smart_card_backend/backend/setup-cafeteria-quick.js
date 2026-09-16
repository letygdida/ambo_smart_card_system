const db = require('./db');

console.log('🚀 Setting up Cafeteria System...');

// Step 1: Add manual_status column to meal_times_config
const addManualStatusColumn = `
  ALTER TABLE meal_times_config 
  ADD COLUMN IF NOT EXISTS manual_status ENUM('open', 'close', 'auto') DEFAULT 'auto'
`;

db.query(addManualStatusColumn, (err) => {
  if (err && !err.message.includes('Duplicate column')) {
    console.error('❌ Error adding manual_status column:', err.message);
  } else {
    console.log('✅ manual_status column ready');
  }

  // Step 2: Create cafeteria_attendance table if it doesn't exist
  const createCafeteriaTable = `
    CREATE TABLE IF NOT EXISTS cafeteria_attendance (
      id int(11) NOT NULL AUTO_INCREMENT,
      attendance_id varchar(50) NOT NULL COMMENT 'Unique attendance record ID (ATT-CAFT-uuid)',
      student_id varchar(50) NOT NULL COMMENT 'Student ID from users table',
      student_name varchar(200) DEFAULT NULL COMMENT 'Student full name for quick reference',
      department_id int(11) DEFAULT NULL COMMENT 'Department ID',
      department_name varchar(100) DEFAULT NULL COMMENT 'Department name for quick reference',
      meal_type varchar(50) NOT NULL COMMENT 'breakfast, lunch, dinner',
      attendance_date date NOT NULL COMMENT 'Date of attendance (YYYY-MM-DD)',
      scan_time time NOT NULL COMMENT 'Time when student scanned (HH:MM:SS)',
      scanner_id varchar(50) DEFAULT NULL COMMENT 'Scanner device ID',
      scanner_location varchar(100) DEFAULT NULL COMMENT 'Scanner location for quick reference',
      attendance_status varchar(50) DEFAULT 'attended' COMMENT 'attended, rejected_duplicate, rejected_outside_time',
      rejection_reason varchar(255) DEFAULT NULL COMMENT 'Reason if rejected',
      verification_method varchar(50) DEFAULT 'smart_card' COMMENT 'smart_card, qr_code, manual, auto_insert',
      campus varchar(100) DEFAULT NULL COMMENT 'Campus name',
      notes text COMMENT 'Additional notes',
      created_at timestamp DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_attendance_id (attendance_id),
      UNIQUE KEY uk_student_meal_date (student_id, meal_type, attendance_date) COMMENT 'Prevent duplicate meal attendance per day',
      KEY idx_student_id (student_id),
      KEY idx_meal_type (meal_type),
      KEY idx_attendance_date (attendance_date),
      KEY idx_attendance_status (attendance_status),
      KEY idx_scanner_id (scanner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Cafeteria attendance tracking separate from main attendance'
  `;

  db.query(createCafeteriaTable, (err2) => {
    if (err2) {
      console.error('❌ Error creating cafeteria_attendance table:', err2.message);
    } else {
      console.log('✅ cafeteria_attendance table ready');
    }

    // Step 3: Create scanner_locations table if needed
    const createScannersTable = `
      CREATE TABLE IF NOT EXISTS scanner_locations (
        id int(11) NOT NULL AUTO_INCREMENT,
        scanner_id varchar(50) NOT NULL,
        location_type varchar(50) NOT NULL,
        location_name varchar(100) NOT NULL,
        building varchar(100) DEFAULT NULL,
        floor varchar(50) DEFAULT NULL,
        campus varchar(100) DEFAULT NULL,
        is_active tinyint(1) DEFAULT 1,
        notes text,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY uk_scanner_id (scanner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `;

    db.query(createScannersTable, (err3) => {
      if (err3) {
        console.error('❌ Error creating scanner_locations:', err3.message);
      } else {
        console.log('✅ scanner_locations table ready');
      }

      // Step 4: Insert default data
      const insertData = `
        INSERT INTO meal_times_config (meal_type, start_time, end_time, is_active, daily_limit, description, manual_status) 
        VALUES 
          ('breakfast', '01:00:00', '02:00:00', 1, 1, 'Breakfast meal window', 'auto'),
          ('lunch', '05:00:00', '07:00:00', 1, 1, 'Lunch meal window', 'auto'),
          ('dinner', '11:00:00', '13:00:00', 1, 1, 'Dinner meal window', 'auto')
        ON DUPLICATE KEY UPDATE 
          start_time = VALUES(start_time),
          end_time = VALUES(end_time),
          is_active = VALUES(is_active),
          manual_status = COALESCE(manual_status, 'auto')
      `;

      db.query(insertData, (err4) => {
        if (err4) {
          console.error('❌ Error inserting meal times:', err4.message);
        } else {
          console.log('✅ Meal times configured');
        }

        // Insert default scanner
        const insertScanner = `
          INSERT INTO scanner_locations (scanner_id, location_type, location_name, building, campus) 
          VALUES ('CAFT-SCANNER-001', 'cafeteria', 'Main Cafeteria', 'Student Center', 'Main Campus')
          ON DUPLICATE KEY UPDATE location_name = VALUES(location_name)
        `;

        db.query(insertScanner, (err5) => {
          if (err5) {
            console.error('❌ Error inserting scanner:', err5.message);
          } else {
            console.log('✅ Default cafeteria scanner configured');
          }

          // Final verification
          db.query('SELECT * FROM meal_times_config', (err6, results) => {
            if (err6) {
              console.error('❌ Verification error:', err6.message);
            } else {
              console.log('\n📋 Current Meal Configuration:');
              results.forEach(meal => {
                console.log(`  ${meal.meal_type}: ${meal.start_time} - ${meal.end_time} (${meal.manual_status || 'auto'})`);
              });
            }

            console.log('\n🎯 Cafeteria system setup complete!');
            console.log('✅ Manual open/close controls are now available');
            console.log('✅ Real-time attendance tracking enabled');
            console.log('\nNext steps:');
            console.log('1. Restart the backend server');
            console.log('2. Use the Manual Control buttons in the cafeteria dashboard');
            console.log('3. Test student attendance scanning');
            
            process.exit(0);
          });
        });
      });
    });
  });
});