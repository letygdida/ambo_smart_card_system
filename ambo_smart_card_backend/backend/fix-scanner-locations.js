const db = require('./db');

console.log('🔧 Fixing scanner_locations table...\n');

// Check if scanner_locations table exists
db.query('SHOW TABLES LIKE "scanner_locations"', (err, results) => {
  if (err) {
    console.error('❌ Error checking tables:', err.message);
    process.exit(1);
  }

  if (results.length === 0) {
    console.log('📋 Creating scanner_locations table...');
    
    const createTable = `
      CREATE TABLE scanner_locations (
        id int(11) NOT NULL AUTO_INCREMENT,
        scanner_id varchar(50) NOT NULL,
        location_type varchar(50) NOT NULL,
        location_name varchar(100) NOT NULL,
        building varchar(100) DEFAULT NULL,
        floor varchar(50) DEFAULT NULL,
        campus varchar(100) DEFAULT 'Main Campus',
        is_active tinyint(1) DEFAULT 1,
        notes text,
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY uk_scanner_id (scanner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `;
    
    db.query(createTable, (createErr) => {
      if (createErr) {
        console.error('❌ Error creating table:', createErr.message);
        process.exit(1);
      }
      
      console.log('✅ scanner_locations table created');
      
      // Insert default scanner
      const insertScanner = `
        INSERT INTO scanner_locations (scanner_id, location_type, location_name, building, campus)
        VALUES ('CAFT-SCANNER-001', 'cafeteria', 'Main Cafeteria', 'Student Center', 'Main Campus')
      `;
      
      db.query(insertScanner, (insertErr) => {
        if (insertErr) {
          console.error('❌ Error inserting default scanner:', insertErr.message);
        } else {
          console.log('✅ Default cafeteria scanner added');
        }
        
        console.log('\n🎯 Scanner locations table is ready!');
        process.exit(0);
      });
    });
  } else {
    console.log('✅ scanner_locations table already exists');
    
    // Check if default scanner exists
    db.query(
      'SELECT * FROM scanner_locations WHERE scanner_id = ?',
      ['CAFT-SCANNER-001'],
      (scanErr, scanResults) => {
        if (scanErr) {
          console.error('❌ Error checking scanner:', scanErr.message);
          process.exit(1);
        }
        
        if (scanResults.length === 0) {
          console.log('📋 Adding default cafeteria scanner...');
          
          const insertScanner = `
            INSERT INTO scanner_locations (scanner_id, location_type, location_name, building, campus)
            VALUES ('CAFT-SCANNER-001', 'cafeteria', 'Main Cafeteria', 'Student Center', 'Main Campus')
          `;
          
          db.query(insertScanner, (insertErr) => {
            if (insertErr) {
              console.error('❌ Error inserting scanner:', insertErr.message);
            } else {
              console.log('✅ Default cafeteria scanner added');
            }
            
            console.log('\n🎯 Scanner locations table is ready!');
            process.exit(0);
          });
        } else {
          console.log('✅ Default cafeteria scanner already exists');
          console.log('\n🎯 Scanner locations table is ready!');
          process.exit(0);
        }
      }
    );
  }
});