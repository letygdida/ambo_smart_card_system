const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ambo_smart_card'
});

console.log('Setting up cafeteria tables and data...\n');

// Create meal_times_config table if it doesn't exist
const createMealTimesTable = `
CREATE TABLE IF NOT EXISTS meal_times_config (
  id int(11) NOT NULL AUTO_INCREMENT,
  meal_type varchar(50) NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active tinyint(1) DEFAULT 1,
  daily_limit int(11) DEFAULT 1,
  description text,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uk_meal_type (meal_type)
)`;

connection.query(createMealTimesTable, (err) => {
  if (err) {
    console.error('Error creating meal_times_config:', err);
    connection.end();
    return;
  }
  
  console.log('✓ meal_times_config table ready');
  
  // Insert meal times data
  const insertMealTimes = `
    INSERT INTO meal_times_config (meal_type, start_time, end_time, is_active, daily_limit, description) 
    VALUES 
      ('breakfast', '01:00:00', '02:00:00', 1, 1, 'Breakfast meal window'),
      ('lunch', '05:00:00', '07:00:00', 1, 1, 'Lunch meal window'),
      ('dinner', '11:00:00', '12:30:00', 1, 1, 'Dinner meal window')
    ON DUPLICATE KEY UPDATE 
      start_time = VALUES(start_time),
      end_time = VALUES(end_time),
      is_active = VALUES(is_active)
  `;
  
  connection.query(insertMealTimes, (err2) => {
    if (err2) {
      console.error('Error inserting meal times:', err2);
    } else {
      console.log('✓ Meal times configured');
    }
    
    // Create scanner_locations table if needed
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
    )`;
    
    connection.query(createScannersTable, (err3) => {
      if (err3) {
        console.error('Error creating scanner_locations:', err3);
      } else {
        console.log('✓ scanner_locations table ready');
      }
      
      // Insert default scanner
      const insertScanner = `
        INSERT INTO scanner_locations (scanner_id, location_type, location_name, building, campus) 
        VALUES ('CAFT-SCANNER-001', 'cafeteria', 'Main Cafeteria', 'Student Center', 'Main Campus')
        ON DUPLICATE KEY UPDATE location_name = VALUES(location_name)
      `;
      
      connection.query(insertScanner, (err4) => {
        if (err4) {
          console.error('Error inserting scanner:', err4);
        } else {
          console.log('✓ Default cafeteria scanner configured');
        }
        
        // Verify setup
        connection.query('SELECT * FROM meal_times_config', (err5, meals) => {
          if (err5) {
            console.error('Error checking meals:', err5);
          } else {
            console.log('\n=== MEAL TIMES CONFIG ===');
            meals.forEach(meal => {
              console.log(`${meal.meal_type}: ${meal.start_time} - ${meal.end_time} (active: ${meal.is_active})`);
            });
          }
          
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
          console.log(`\nCurrent time: ${currentTime}`);
          
          // Test the meal query
          connection.query(
            'SELECT meal_type FROM meal_times_config WHERE is_active = 1 AND ? BETWEEN start_time AND end_time LIMIT 1',
            [currentTime],
            (err6, currentMeal) => {
              if (err6) {
                console.error('Error testing meal query:', err6);
              } else {
                if (currentMeal && currentMeal.length > 0) {
                  console.log(`✓ Current meal window: ${currentMeal[0].meal_type}`);
                } else {
                  console.log('ℹ No current meal window (outside meal times)');
                }
              }
              
              connection.end();
              console.log('\n🎯 Setup complete! Auto-insert should now work during meal times.');
            }
          );
        });
      });
    });
  });
});