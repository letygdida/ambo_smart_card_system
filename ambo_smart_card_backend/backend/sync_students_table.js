const db = require('./db');

console.log('🔄 Syncing Students Table...\n');

// Find users that don't have student records
const checkSql = `
    SELECT 
        u.id,
        u.student_id,
        u.username,
        u.full_name,
        u.department,
        u.year,
        s.id as has_student_record
    FROM users u
    LEFT JOIN students s ON u.student_id = s.student_id
    WHERE u.registration_status = 'approved' AND u.role = 'student' AND s.id IS NULL
`;

db.query(checkSql, (err, missingRecords) => {
    if (err) {
        console.error('❌ Error checking for missing records:', err);
        process.exit(1);
    }

    if (!missingRecords || missingRecords.length === 0) {
        console.log('✅ All students already have student table records!');
        process.exit(0);
    }

    console.log(`Found ${missingRecords.length} students missing from students table:\n`);
    
    let processedCount = 0;
    let errorCount = 0;

    missingRecords.forEach((user, index) => {
        const insertSql = `
            INSERT INTO students 
            (student_id, username, department, year, status)
            VALUES (?, ?, ?, ?, 'active')
        `;

        db.query(
            insertSql,
            [user.student_id, user.username || user.full_name, user.department, user.year],
            (insertErr) => {
                if (insertErr) {
                    console.log(`❌ Error creating record for ${user.username}: ${insertErr.message}`);
                    errorCount++;
                } else {
                    console.log(`✅ Created student record for ${user.username} (${user.student_id})`);
                    processedCount++;
                }

                // After all are processed
                if (processedCount + errorCount === missingRecords.length) {
                    console.log(`\n📊 Sync complete:`);
                    console.log(`   ✅ Created: ${processedCount}`);
                    console.log(`   ❌ Failed: ${errorCount}`);
                    process.exit(errorCount > 0 ? 1 : 0);
                }
            }
        );
    });
});
