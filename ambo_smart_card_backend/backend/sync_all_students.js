const db = require('./db');

console.log('🔄 Syncing ALL approved students to students table...\n');

// Step 1: Find all approved students in users table that don't have a student record
const checkSql = `
    SELECT 
        u.id,
        u.student_id,
        u.username,
        u.full_name,
        u.department,
        u.year,
        s.id as has_record
    FROM users u
    LEFT JOIN students s ON u.student_id = s.student_id
    WHERE u.registration_status = 'approved' AND u.role = 'student' AND s.id IS NULL
    ORDER BY u.id
`;

db.query(checkSql, (err, missingStudents) => {
    if (err) {
        console.error('❌ Error checking for missing records:', err);
        process.exit(1);
    }

    if (!missingStudents || missingStudents.length === 0) {
        console.log('✅ All approved students already have student table records!');
        console.log('Database is synced and ready.\n');
        
        // Show summary
        db.query(
            'SELECT COUNT(*) as count FROM students',
            (err, result) => {
                if (!err) {
                    console.log(`📊 Summary:`);
                    console.log(`   Total student records: ${result[0].count}`);
                }
                process.exit(0);
            }
        );
        return;
    }

    console.log(`Found ${missingStudents.length} students missing from students table:\n`);
    missingStudents.forEach(u => {
        console.log(`  ⚠️  ${u.username} (${u.student_id}) - Department: ${u.department}`);
    });
    console.log('');

    let processedCount = 0;
    let errorCount = 0;
    const totalCount = missingStudents.length;

    missingStudents.forEach((user) => {
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
                    console.log(`  ❌ Error: ${user.username} (${user.student_id})`);
                    console.log(`     ${insertErr.message}`);
                    errorCount++;
                } else {
                    console.log(`  ✅ Created: ${user.username} (${user.student_id})`);
                    processedCount++;
                }

                // After all are processed
                if (processedCount + errorCount === totalCount) {
                    console.log(`\n📊 Sync Results:`);
                    console.log(`   ✅ Successfully created: ${processedCount}`);
                    console.log(`   ❌ Failed: ${errorCount}`);
                    console.log(`   📈 Total student records now: ${processedCount + errorCount + missingStudents.length - (processedCount + errorCount)}`);
                    
                    // Get final count
                    db.query(
                        'SELECT COUNT(*) as count FROM students',
                        (err, result) => {
                            if (!err) {
                                console.log(`   🎉 Final student table count: ${result[0].count}`);
                            }
                            console.log('\n✅ Database sync complete!\n');
                            process.exit(errorCount > 0 ? 1 : 0);
                        }
                    );
                }
            }
        );
    });
});
