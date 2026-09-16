const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ambo_smart_card'
});

console.log('Testing database connectivity...\n');

// Test basic connection
connection.query('SELECT NOW() as now_time', (err, results) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    connection.end();
    return;
  }
  
  console.log('✅ Database connected successfully');
  console.log('Current time:', results[0].now_time);
  
  // Test meal_times_config table
  connection.query('SELECT COUNT(*) as count FROM meal_times_config', (err2, results2) => {
    if (err2) {
      console.error('❌ meal_times_config table error:', err2);
    } else {
      console.log(`✅ meal_times_config table exists with ${results2[0].count} records`);
    }
    
    // Test scanner_locations table
    connection.query('SELECT COUNT(*) as count FROM scanner_locations', (err3, results3) => {
      if (err3) {
        console.error('❌ scanner_locations table error:', err3);
      } else {
        console.log(`✅ scanner_locations table exists with ${results3[0].count} records`);
      }
      
      // Test cafeteria_attendance table
      connection.query('SELECT COUNT(*) as count FROM cafeteria_attendance', (err4, results4) => {
        if (err4) {
          console.error('❌ cafeteria_attendance table error:', err4);
        } else {
          console.log(`✅ cafeteria_attendance table exists with ${results4[0].count} records`);
        }
        
        // Show meal times
        connection.query('SELECT * FROM meal_times_config', (err5, results5) => {
          if (err5) {
            console.error('❌ Error fetching meal times:', err5);
          } else {
            console.log('\n=== MEAL TIMES CONFIG ===');
            if (results5.length === 0) {
              console.log('❌ No meal times configured!');
            } else {
              results5.forEach(meal => {
                console.log(`${meal.meal_type}: ${meal.start_time} - ${meal.end_time} (active: ${meal.is_active})`);
              });
            }
          }
          
          connection.end();
        });
      });
    });
  });
});
