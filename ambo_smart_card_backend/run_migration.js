const db = require('./backend/db');
const fs = require('fs');

const sqlFile = './attendance_and_employees.sql';
const sql = fs.readFileSync(sqlFile, 'utf8');

// Split by semicolon and filter out comments and empty statements
const statements = sql.split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

let executed = 0;
let errors = [];

function executeStatement(index) {
  if (index >= statements.length) {
    console.log(`\n✓ Migration complete! Executed ${executed} statements`);
    if (errors.length > 0) {
      console.log('\n⚠ Some errors occurred:');
      errors.forEach(e => console.log('  -', e));
    }
    process.exit(0);
  }

  const statement = statements[index];
  if (!statement.trim()) {
    executeStatement(index + 1);
    return;
  }

  db.query(statement, (err, results) => {
    if (err) {
      console.log(`✗ Statement ${index + 1} failed:`, err.message.substring(0, 100));
      errors.push(err.message);
    } else {
      executed++;
      if (index % 5 === 0) {
        console.log(`  Processing statement ${index + 1}/${statements.length}...`);
      }
    }
    executeStatement(index + 1);
  });
}

console.log(`Running migration from ${sqlFile}`);
console.log(`Total statements: ${statements.length}`);
console.log('Starting...\n');

executeStatement(0);

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱ Migration timeout after 30 seconds');
  process.exit(1);
}, 30000);
