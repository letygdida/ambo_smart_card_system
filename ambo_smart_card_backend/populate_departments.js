const db = require('./backend/db');

console.log('🚀 Populating Departments Table...\n');

// Ambo University departments
const departments = [
  { department_code: 'CS', department_name: 'Computer Science', campus: 'Main Campus', status: 'active' },
  { department_code: 'SE', department_name: 'Software Engineering', campus: 'Main Campus', status: 'active' },
  { department_code: 'IS', department_name: 'Information Systems', campus: 'Main Campus', status: 'active' },
  { department_code: 'EE', department_name: 'Electrical Engineering', campus: 'Main Campus', status: 'active' },
  { department_code: 'ME', department_name: 'Mechanical Engineering', campus: 'Main Campus', status: 'active' },
  { department_code: 'CE', department_name: 'Civil Engineering', campus: 'Main Campus', status: 'active' },
  { department_code: 'BA', department_name: 'Business Administration', campus: 'Main Campus', status: 'active' },
  { department_code: 'AC', department_name: 'Accounting', campus: 'Main Campus', status: 'active' },
  { department_code: 'EC', department_name: 'Economics', campus: 'Main Campus', status: 'active' },
  { department_code: 'MA', department_name: 'Mathematics', campus: 'Main Campus', status: 'active' },
  { department_code: 'PH', department_name: 'Physics', campus: 'Main Campus', status: 'active' },
  { department_code: 'CH', department_name: 'Chemistry', campus: 'Main Campus', status: 'active' },
  { department_code: 'EN', department_name: 'English Language', campus: 'Main Campus', status: 'active' },
  { department_code: 'HI', department_name: 'History', campus: 'Main Campus', status: 'active' },
  { department_code: 'PS', department_name: 'Psychology', campus: 'Main Campus', status: 'active' },
  { department_code: 'SO', department_name: 'Sociology', campus: 'Main Campus', status: 'active' },
  { department_code: 'GE', department_name: 'Geography', campus: 'Main Campus', status: 'active' },
  { department_code: 'AR', department_name: 'Architecture', campus: 'Main Campus', status: 'active' },
  { department_code: 'AG', department_name: 'Agriculture', campus: 'Main Campus', status: 'active' },
  { department_code: 'LV', department_name: 'Law', campus: 'Main Campus', status: 'active' }
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
    console.log('1. Restart the backend server');
    console.log('2. Refresh the Students/Employees pages');
    console.log('3. Verify the Department dropdown now shows all departments');
    process.exit(0);
  }

  const dept = departments[index];
  
  db.query(
    `INSERT INTO departments (department_code, department_name, campus, status) 
     VALUES (?, ?, ?, ?)`,
    [dept.department_code, dept.department_name, dept.campus, dept.status],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  Skipped: ${dept.department_name} (already exists)`);
          skipped++;
        } else {
          console.error(`✗ Error inserting ${dept.department_name}:`, err.message);
          errors++;
        }
      } else {
        console.log(`✓ Inserted: ${dept.department_name} (${dept.department_code})`);
        inserted++;
      }
      
      insertNext(index + 1);
    }
  );
}

insertNext(0);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Timeout');
  process.exit(1);
}, 30000);
