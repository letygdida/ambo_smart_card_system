const db = require('./db');

console.log('Testing approved students query...\n');

const query = `
SELECT 
    u.id,
    u.student_id,
    u.username,
    u.full_name,
    u.department,
    u.year,
    s.smart_card_id,
    s.status
FROM users u
LEFT JOIN students s ON u.student_id = s.student_id
WHERE u.role = 'student' AND u.registration_status = 'approved'
ORDER BY u.registered_at DESC
`;

db.query(query, (err, result) => {
    if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
    
    console.log(`✓ Found ${result.length} approved students:\n`);
    
    result.forEach((s, index) => {
        console.log(`${index + 1}. ${s.student_id} - ${s.full_name || s.username} (${s.department}, Year ${s.year})`);
        console.log(`   Card: ${s.smart_card_id || 'Not issued'} | Status: ${s.status || 'N/A'}\n`);
    });
    
    process.exit(0);
});
