const db = require('./backend/db');

const now = new Date().toTimeString().split(' ')[0];
console.log('Current time:', now);
console.log('Testing meal query...\n');

db.query(
  'SELECT meal_type, start_time, end_time FROM meal_times_config WHERE is_active = 1 ORDER BY start_time',
  [],
  (err, results) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    
    console.log('All active meals:');
    results.forEach(m => {
      console.log(`  ${m.meal_type}: ${m.start_time} - ${m.end_time}`);
    });
    
    // Test the BETWEEN query
    console.log('\nTesting BETWEEN query with time:', now);
    
    const betweenQuery = 'SELECT meal_type, start_time, end_time FROM meal_times_config WHERE is_active = 1 AND TIME(?) BETWEEN start_time AND end_time';
    
    db.query(betweenQuery, [now], (err2, results2) => {
      if (err2) {
        console.error('BETWEEN query error:', err2);
        
        // Try alternative query
        console.log('\nTrying TIME comparison instead...');
        const altQuery = 'SELECT meal_type, start_time, end_time FROM meal_times_config WHERE is_active = 1 AND TIME(?) >= start_time AND TIME(?) <= end_time';
        
        db.query(altQuery, [now, now], (err3, results3) => {
          if (err3) {
            console.error('Alternative query error:', err3);
          } else {
            console.log('Alternative query results:', results3);
          }
          process.exit(0);
        });
      } else {
        console.log('BETWEEN results:', results2);
        process.exit(0);
      }
    });
  }
);
