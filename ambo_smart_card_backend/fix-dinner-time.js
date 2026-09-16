const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ambo_smart_card'
});

console.log('Fixing dinner time...\n');

// Update dinner end time to 13:00:00 for testing
connection.query(
  'UPDATE meal_times_config SET end_time = ? WHERE meal_type = ?',
  ['13:00:00', 'dinner'],
  (err) => {
    if (err) {
      console.error('Error updating dinner time:', err);
      connection.end();
      return;
    }
    
    console.log('✓ Updated dinner end time to 13:00:00');
    
    // Test current time
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
    console.log('Current time:', currentTime);
    
    // Test meal query
    connection.query(
      'SELECT meal_type FROM meal_times_config WHERE is_active = 1 AND ? BETWEEN start_time AND end_time LIMIT 1',
      [currentTime],
      (err2, results) => {
        if (err2) {
          console.error('Query error:', err2);
        } else {
          if (results && results.length > 0) {
            console.log('✅ Current meal window:', results[0].meal_type);
          } else {
            console.log('❌ Still no meal window found');
            
            // Show all meals for debugging
            connection.query('SELECT * FROM meal_times_config', (err3, allMeals) => {
              console.log('\nAll meals:');
              allMeals.forEach(meal => {
                const inWindow = currentTime >= meal.start_time && currentTime <= meal.end_time;
                console.log(`  ${meal.meal_type}: ${meal.start_time} - ${meal.end_time} ${inWindow ? '✅' : '❌'}`);
              });
            });
          }
        }
        
        connection.end();
      }
    );
  }
);