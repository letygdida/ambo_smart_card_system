const db = require('./db');

console.log('=== Checking Student Sync Status ===\n');

// Check approved students in users table
db.query(
    "SELECT id, student_id, full_name, username, registration_status FROM users WHERE role='student' AND registration_status='approved' ORDER BY id",
    (err, approvedUsers) => {
        if (err) {
            console.error('Error:', err);
            process.exit(1);
        }

        console.log(`✅ Approved students in USERS table: ${approvedUsers.length}\n`);
        approvedUsers.forEach((user, i) => {
            console.log(`${i + 1}. ${user.full_name || user.username} (${user.student_id})`);
        });

        // Check students in students table
        db.query(
            "SELECT * FROM students ORDER BY id",
            (err, students) => {
                if (err) {
                    console.error('Error:', err);
                    process.exit(1);
                }

                console.log(`\n✅ Students in STUDENTS table: ${students.length}\n`);
                students.forEach((student, i) => {
                    console.log(`${i + 1}. ${student.username} (${student.student_id}) - Card: ${student.smart_card_id} - Status: ${student.status}`);
                });

                // Find missing students
                const studentIds = students.map(s => s.student_id);
                const missing = approvedUsers.filter(u => !studentIds.includes(u.student_id));

                if (missing.length > 0) {
                    console.log(`\n⚠️  ${missing.length} approved students NOT in students table:`);
                    missing.forEach(m => console.log(`   - ${m.full_name || m.username} (${m.student_id})`));
                } else {
                    console.log('\n✅ All approved students are synced to students table!');
                }

                process.exit(0);
            }
        );
    }
);
