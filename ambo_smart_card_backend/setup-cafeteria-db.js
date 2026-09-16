#!/usr/bin/env node

/**
 * Cafeteria Attendance Dashboard - Database Setup Script
 * This script creates all required tables for cafeteria attendance
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '', // Update if your root has a password
  database: 'ambo_smart_card',
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Cafeteria Attendance Dashboard - Database Setup\n');
    console.log('📋 Connecting to MySQL...');
    
    connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password || undefined,
      database: DB_CONFIG.database
    });
    
    console.log('✅ Connected to MySQL\n');
    
    // Create cafeteria_attendance table
    console.log('⏳ Creating cafeteria_attendance table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`cafeteria_attendance\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`attendance_id\` varchar(50) NOT NULL UNIQUE,
        \`student_id\` varchar(50) NOT NULL,
        \`student_name\` varchar(100),
        \`department_id\` int(11),
        \`department_name\` varchar(100),
        \`meal_type\` varchar(50) NOT NULL,
        \`attendance_date\` date NOT NULL,
        \`scan_time\` time NOT NULL,
        \`scanner_id\` varchar(50),
        \`scanner_location\` varchar(100),
        \`attendance_status\` varchar(50) DEFAULT 'attended',
        \`rejection_reason\` varchar(255),
        \`verification_method\` varchar(50),
        \`campus\` varchar(100),
        \`notes\` text,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_attendance_id\` (\`attendance_id\`),
        UNIQUE KEY \`uk_student_meal_date\` (\`student_id\`, \`meal_type\`, \`attendance_date\`),
        KEY \`idx_student_id\` (\`student_id\`),
        KEY \`idx_attendance_date\` (\`attendance_date\`),
        KEY \`idx_meal_type\` (\`meal_type\`),
        KEY \`idx_attendance_status\` (\`attendance_status\`),
        KEY \`idx_department_id\` (\`department_id\`),
        KEY \`idx_student_meal_date_status\` (\`student_id\`, \`meal_type\`, \`attendance_date\`, \`attendance_status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✅ cafeteria_attendance table created\n');
    
    // Create meal_times_config table
    console.log('⏳ Creating meal_times_config table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`meal_times_config\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`meal_type\` varchar(50) NOT NULL UNIQUE,
        \`start_time\` time NOT NULL,
        \`end_time\` time NOT NULL,
        \`is_active\` boolean DEFAULT TRUE,
        \`daily_limit\` int(11) DEFAULT 1,
        \`description\` varchar(255),
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✅ meal_times_config table created\n');
    
    // Create scanner_locations table
    console.log('⏳ Creating scanner_locations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`scanner_locations\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`scanner_id\` varchar(50) NOT NULL UNIQUE,
        \`location_type\` varchar(50) NOT NULL,
        \`location_name\` varchar(100) NOT NULL,
        \`building\` varchar(100),
        \`floor\` varchar(50),
        \`campus\` varchar(100),
        \`is_active\` boolean DEFAULT TRUE,
        \`notes\` text,
        \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('✅ scanner_locations table created\n');
    
    // Insert meal times
    console.log('⏳ Inserting meal times...');
    await connection.execute(`
      INSERT IGNORE INTO \`meal_times_config\` 
      (\`meal_type\`, \`start_time\`, \`end_time\`, \`is_active\`, \`daily_limit\`, \`description\`) 
      VALUES
      ('breakfast', '01:00:00', '02:00:00', TRUE, 1, 'Breakfast meal window'),
      ('lunch', '05:00:00', '07:00:00', TRUE, 1, 'Lunch meal window'),
      ('dinner', '11:00:00', '12:30:00', TRUE, 1, 'Dinner meal window')
    `);
    console.log('✅ Meal times inserted (3 rows)\n');
    
    // Insert scanner locations
    console.log('⏳ Inserting scanner locations...');
    await connection.execute(`
      INSERT IGNORE INTO \`scanner_locations\` 
      (\`scanner_id\`, \`location_type\`, \`location_name\`, \`building\`, \`campus\`) 
      VALUES
      ('CAFT-SCANNER-001', 'cafeteria', 'Cafeteria Ground Floor', 'Main Building', 'Hachalu Hundessa Campus'),
      ('CAFT-SCANNER-002', 'cafeteria', 'Cafeteria First Floor', 'Main Building', 'Hachalu Hundessa Campus')
    `);
    console.log('✅ Scanner locations inserted (2 rows)\n');
    
    // Verify installation
    console.log('📋 Verifying installation...\n');
    
    const [cafeteriaCount] = await connection.execute('SELECT COUNT(*) as count FROM cafeteria_attendance');
    const [mealTimesCount] = await connection.execute('SELECT COUNT(*) as count FROM meal_times_config');
    const [scannersCount] = await connection.execute('SELECT COUNT(*) as count FROM scanner_locations');
    
    console.log('📊 Installation Summary:');
    console.log(`   • cafeteria_attendance: 0 records`);
    console.log(`   • meal_times_config: ${mealTimesCount[0].count} records`);
    console.log(`   • scanner_locations: ${scannersCount[0].count} records\n`);
    
    console.log('✅ Database setup completed successfully!\n');
    
    console.log('📋 Next Steps:');
    console.log('   1. Restart backend server: npm start');
    console.log('   2. Clear browser cache: Ctrl + Shift + Delete');
    console.log('   3. Reload: http://localhost:3000/cafeteria-attendance\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   • MySQL connection failed');
      console.error('   • Check username and password in this script');
      console.error('   • Edit line: const DB_CONFIG = {...}');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   • Database "ambo_smart_card" not found');
      console.error('   • Create it first: CREATE DATABASE ambo_smart_card;');
    } else {
      console.error('   • See error above for details');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
