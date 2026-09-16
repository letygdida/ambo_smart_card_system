const db = require('./db');

console.log('🔍 Debugging Student IDs...\n');

// Get students with both table IDs
const sql = `
    SELECT 
        u.id as user_id,
        s.id as student_table_id,
        u.student_id,
        u.username,
        u.full_name,
        u.department,
        u.year,
        s.status,
        s.smart_card_id
    FROM users u
    LEFT JOIN students s ON u.student_id = s.student_id
    WHERE u.registration_status = 'approved' AND u.role = 'student'
    LIMIT 10
`;

db.query(sql, (err, results) => {
    if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }

    if (!results || results.length === 0) {
        console.log('⚠️ No students found');
        process.exit(0);
    }

    console.log(`Found ${results.length} approved students:\n`);
    console.log('user_id | student_table_id | student_id | username | department | status');
    console.log('--------|-----------------|------------|----------|------------|---------');
    
    results.forEach(row => {
        const status = row.student_table_id ? (row.status || 'N/A') : 'NO RECORD';
        console.log(`${String(row.user_id).padEnd(7)} | ${String(row.student_table_id || 'NULL').padEnd(16)} | ${String(row.student_id).padEnd(10)} | ${String(row.username).padEnd(9)} | ${String(row.department).padEnd(11)} | ${status}`);
    });

    console.log('\n📊 Summary:');
    const withStudentRecord = results.filter(r => r.student_table_id).length;
    const withoutStudentRecord = results.filter(r => !r.student_table_id).length;
    console.log(`   - With student table record: ${withStudentRecord}`);
    console.log(`   - Without student table record: ${withoutStudentRecord}`);

    if (withoutStudentRecord > 0) {
        console.log('\n⚠️ These students need student table records created:');
        results.filter(r => !r.student_table_id).forEach(row => {
            console.log(`   - ${row.username} (ID: ${row.student_id})`);
        });
    }

    process.exit(0);
});
