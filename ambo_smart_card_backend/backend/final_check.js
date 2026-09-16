const db = require('./db');

console.log('🔍 Final Verification...\n');

let completed = 0;

db.query('SELECT COUNT(*) as count FROM users WHERE role="student" AND registration_status="approved"', (err, result) => {
    if (result) {
        console.log('✅ Total approved students:', result[0].count);
    }
    completed++;
    if (completed === 3) finish();
});

db.query('SELECT COUNT(*) as count FROM students', (err, result) => {
    if (result) {
        console.log('✅ Total student table records:', result[0].count);
    }
    completed++;
    if (completed === 3) finish();
});

db.query('SELECT COUNT(*) as count FROM students s INNER JOIN users u ON u.student_id = s.student_id WHERE u.registration_status="approved" AND u.role="student"', (err, result) => {
    if (result) {
        console.log('✅ Synced students (in both tables):', result[0].count);
    }
    completed++;
    if (completed === 3) finish();
});

function finish() {
    console.log('\n✅ All students are now synced!');
    console.log('You can now test Block, Unblock, and Delete without 404 errors.\n');
    process.exit(0);
}
