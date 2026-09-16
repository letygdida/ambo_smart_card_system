const db = require('./backend/db');

console.log('Adding department column to employees table...\n');

// Check if column already exists
db.query(`SHOW COLUMNS FROM employees WHERE Field = 'department'`, (err, results) => {
  if (err) {
    console.error('Error checking columns:', err.message);
    process.exit(1);
  }

  if (results && results.length > 0) {
    console.log('✓ Column "department" already exists');
    process.exit(0);
  }

  // Add the column if it doesn't exist
  console.log('Adding department column...');
  
  db.query(`
    ALTER TABLE employees
    ADD COLUMN department VARCHAR(100) AFTER position
  `, (err) => {
    if (err) {
      console.error('Error adding column:', err.message);
      process.exit(1);
    }

    console.log('✓ Column "department" added successfully');
    console.log('\nColumn Details:');
    console.log('  Field: department');
    console.log('  Type: VARCHAR(100)');
    console.log('  Position: After "position" column');
    console.log('  Nullable: Yes (default NULL)');

    // Add index for better query performance
    console.log('\nAdding index for performance...');
    
    db.query(`
      ALTER TABLE employees
      ADD INDEX idx_department (department)
    `, (indexErr) => {
      if (indexErr) {
        console.warn('Warning: Could not add index:', indexErr.message);
      } else {
        console.log('✓ Index added on department column');
      }

      // List all columns in employees table
      console.log('\nCurrent employees table structure:');
      db.query('SHOW COLUMNS FROM employees', (descErr, columns) => {
        if (descErr) {
          console.error('Error:', descErr.message);
        } else {
          console.log('┌─────────────────────┬─────────────────┬──────┬─────┬─────────┬────────────┐');
          console.log('│ Field               │ Type            │ Null │ Key │ Default │ Extra      │');
          console.log('├─────────────────────┼─────────────────┼──────┼─────┼─────────┼────────────┤');
          columns.forEach(col => {
            const field = col.Field.padEnd(20);
            const type = (col.Type || '').substring(0, 15).padEnd(16);
            const nullable = col.Null === 'YES' ? 'Yes' : 'No';
            const key = col.Key || '-';
            const defaultVal = col.Default !== null ? col.Default : '-';
            const extra = col.Extra || '-';
            console.log(`│ ${field}│ ${type}│ ${nullable.padEnd(4)}│ ${key.padEnd(4)}│ ${String(defaultVal).padEnd(8)}│ ${extra} │`);
          });
          console.log('└─────────────────────┴─────────────────┴──────┴─────┴─────────┴────────────┘');
        }
        process.exit(0);
      });
    });
  });
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Timeout');
  process.exit(1);
}, 10000);
