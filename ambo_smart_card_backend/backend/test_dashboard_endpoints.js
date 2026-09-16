const db = require('./db');

console.log('Testing both dashboard endpoints...\n');

// Test /api/dashboard/stats endpoint
console.log('=== Testing /stats endpoint ===');
const statsQueries = {
    totalStudents: "SELECT COUNT(*) as count FROM users WHERE role='student' AND registration_status='approved'",
    totalCardsIssued: "SELECT COUNT(*) as count FROM students WHERE smart_card_id IS NOT NULL AND smart_card_id != ''",
    pendingRegistrations: "SELECT COUNT(*) as count FROM users WHERE role='student' AND registration_status='pending'",
    todayAttendance: "SELECT COUNT(*) as count FROM attendance WHERE DATE(date) = CURDATE()"
};

const stats = {};
let completed = 0;

Object.keys(statsQueries).forEach(key => {
    db.query(statsQueries[key], (err, result) => {
        if (err) {
            console.error(`❌ ${key}:`, err.message);
        } else {
            stats[key] = result[0].count;
            console.log(`✓ ${key}: ${result[0].count}`);
        }

        completed++;
        if (completed === Object.keys(statsQueries).length) {
            console.log('\n/stats response would be:', JSON.stringify(stats, null, 2));
            
            // Test main endpoint
            console.log('\n=== Testing main / endpoint ===');
            const mainSQL = `
            SELECT
            (SELECT COUNT(*) FROM users WHERE role='student' AND registration_status='approved') AS totalStudents,
            (SELECT COUNT(*) FROM students WHERE smart_card_id IS NOT NULL AND smart_card_id != '') AS totalCards
            `;
            
            db.query(mainSQL, (err, result) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    console.log('Main endpoint stats:', result[0]);
                }
                process.exit(0);
            });
        }
    });
});
