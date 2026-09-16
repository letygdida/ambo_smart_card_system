const db = require('./db');

console.log('Testing dashboard stats queries...\n');

const queries = {
    totalStudents: "SELECT COUNT(*) as count FROM users WHERE role='student' AND registration_status='approved'",
    totalCardsIssued: "SELECT COUNT(*) as count FROM students WHERE smart_card_id IS NOT NULL AND smart_card_id != ''",
    pendingRegistrations: "SELECT COUNT(*) as count FROM users WHERE role='student' AND registration_status='pending'",
    todayAttendance: "SELECT COUNT(*) as count FROM attendance WHERE DATE(date) = CURDATE()"
};

let completed = 0;
const stats = {};

Object.keys(queries).forEach(key => {
    db.query(queries[key], (err, result) => {
        if (err) {
            console.error(`❌ ${key}:`, err.message);
            stats[key] = 0;
        } else {
            stats[key] = result[0].count;
            console.log(`✓ ${key}: ${result[0].count}`);
        }

        completed++;
        if (completed === Object.keys(queries).length) {
            console.log('\nFinal stats:', stats);
            process.exit(0);
        }
    });
});
