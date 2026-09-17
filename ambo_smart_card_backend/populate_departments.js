const db = require('./backend/db');

console.log('🚀 Populating Departments Table...\n');

// Ambo University departments (using code and name to match production schema)
const departments = [
  { code: 'CS', name: 'Computer Science' },
  { code: 'SE', name: 'Software Engineering' },
  { code: 'IS', name: 'Information Systems' },
  { code: 'EE', name: 'Electrical Engineering' },
  { code: 'ME', name: 'Mechanical Engineering' },
  { code: 'CE', name: 'Civil Engineering' },
  { code: 'BA', name: 'Business Administration' },
  { code: 'AC', name: 'Accounting' },
  { code: 'EC', name: 'Economics' },
  { code: 'MA', name: 'Mathematics' },
  { code: 'PH', name: 'Physics' },
  { code: 'CH', name: 'Chemistry' },
  { code: 'EN', name: 'English Language' },
  { code: 'HI', name: 'History' },
  { code: 'PS', name: 'Psychology' },
  { code: 'SO', name: 'Sociology' },
  { code: 'GE', name: 'Geography' },
  { code: 'AR', name: 'Architecture' },
  { code: 'AG', name: 'Agriculture' },
  { code: 'LV', name: 'Law' }
];

console.log(`Found ${departments.length} departments to insert\n`);

let inserted = 0;
let skipped = 0;
let errors = 0;

function insertNext(index) {
  if (index >= departments.length) {
    console.log(`\n========================================`);
    console.log(`✅ COMPLETE: ${inserted} departments inserted, ${skipped} skipped, ${errors} errors`);
    console.log(`========================================\n`);
    console.log('Next steps:');
    console.log('1. Restart the backend server to apply the departments route fix');
    console.log('2. Refresh the Students/Employees pages');
    console.log('3. Verify the Department dropdown now shows all departments');
    console.log('4. Test with: SELECT * FROM departments;');
    process.exit(0);
  }

  const dept = departments[index];

  // Check if department with same code already exists
  db.query(
    `SELECT id FROM departments WHERE code = ?`,
    [dept.code],
    (err, result) => {
      if (err) {
        console.error(`✗ Error checking ${dept.name}:`, err.message);
        errors++;
        insertNext(index + 1);
        return;
      }

      if (result.length > 0) {
        console.log(`⏭️  Skipped: ${dept.name} (already exists with id=${result[0].id})`);
        skipped++;
        insertNext(index + 1);
        return;
      }

      // Insert new department
      db.query(
        `INSERT INTO departments (code, name) VALUES (?, ?)`,
        [dept.code, dept.name],
        (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              console.log(`⏭️  Skipped: ${dept.name} (already exists)`);
              skipped++;
            } else {
              console.error(`✗ Error inserting ${dept.name}:`, err.message);
              errors++;
            }
          } else {
            console.log(`✓ Inserted: ${dept.name} (${dept.code})`);
            inserted++;
          }

          insertNext(index + 1);
        }
      );
    }
  );
}

insertNext(0);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Timeout');
  process.exit(1);
}, 30000);
