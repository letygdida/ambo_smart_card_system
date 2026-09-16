const db = require('./db');

console.log('🔍 Checking users table structure...\n');

db.query('DESCRIBE users', (err, results) => {
  if (err) {
    console.error('❌ Error:', err.message);
    return;
  }

  console.log('📋 Users table columns:');
  results.forEach(col => {
    console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
  });

  // Test query for a sample student
  console.log('\n🧪 Sample student query:');
  db.query('SELECT * FROM users WHERE role = "student" LIMIT 1', (err2, student) => {
    if (err2) {
      console.error('❌ Sample query error:', err2.message);
      return;
    }

    if (student.length > 0) {
      console.log('Sample student record:');
      console.log(JSON.stringify(student[0], null, 2));
    } else {
      console.log('No student records found');
    }

    process.exit(0);
  });
});