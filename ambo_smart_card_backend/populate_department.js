const db = require('./backend/db');

console.log('Populating department column in employees table\n');

// Example department mappings
const departmentMappings = [
  { employee_id: 'AU-EMP-2026-0001', department: 'IT Support' },
  { employee_id: 'AU-EMP-2026-0002', department: 'IT Support' },
  { employee_id: 'AU-EMP-2026-0003', department: 'Computer Science' },
  // Add more as needed
];

if (departmentMappings.length === 0) {
  console.log('No department mappings provided.');
  console.log('Edit this file and add mappings to departmentMappings array.');
  process.exit(0);
}

console.log(`Updating ${departmentMappings.length} employees...\n`);

let updated = 0;
let errors = 0;

function updateNext(index) {
  if (index >= departmentMappings.length) {
    console.log(`\n✓ Complete: ${updated} employees updated, ${errors} errors`);
    process.exit(0);
  }

  const mapping = departmentMappings[index];
  
  db.query(
    'UPDATE employees SET department = ? WHERE employee_id = ?',
    [mapping.department, mapping.employee_id],
    (err, result) => {
      if (err) {
        console.error(`✗ Error updating ${mapping.employee_id}:`, err.message);
        errors++;
      } else if (result.affectedRows > 0) {
        console.log(`✓ Updated: ${mapping.employee_id} → ${mapping.department}`);
        updated++;
      } else {
        console.log(`⚠ No match: ${mapping.employee_id} (employee not found)`);
        errors++;
      }
      
      updateNext(index + 1);
    }
  );
}

updateNext(0);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\nTimeout');
  process.exit(1);
}, 30000);
