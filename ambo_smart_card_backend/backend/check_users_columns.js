const db = require('./db');

db.query('DESCRIBE users', (err, results) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Users table columns:');
    results.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
    });
  }
  process.exit(0);
});
