const db = require('./db');

console.log('Syncing approved students to students table...\n');

// Get all approved students from users table
db.query(
    "SELECT * FROM users WHERE role='student' AND registration_status='approved'",
    (err, approvedStudents) => {
        if (err) {
            console.error('Error fetching approved students:', err);
            process.exit(1);
        }

        console.log(`Found ${approvedStudents.length} approved students\n`);

        if (approvedStudents.length === 0) {
            console.log('No approved students to sync');
            process.exit(0);
        }

        let processed = 0;

        approvedStudents.forEach((student, index) => {
            const cardId = `CARD-2026-${String(student.id).padStart(4, '0')}`;

            const insertSql = `
                INSERT INTO students (
                    student_id, username, department, year, smart_card_id, photo, status
                ) VALUES (?, ?, ?, ?, ?, ?, 'active')
                ON DUPLICATE KEY UPDATE
                    username=VALUES(username),
                    department=VALUES(department),
                    year=VALUES(year),
                    smart_card_id=VALUES(smart_card_id),
                    photo=VALUES(photo),
                    status=VALUES(status)
            `;

            db.query(insertSql, [
                student.student_id,
                student.full_name || student.username,
                student.department,
                student.year,
                cardId,
                student.photo
            ], (err, result) => {
                processed++;

                if (err) {
                    console.error(`❌ Error syncing ${student.student_id}:`, err.message);
                } else {
                    console.log(`✅ ${index + 1}. Synced: ${student.full_name} (${student.student_id}) - Card: ${cardId}`);
                }

                if (processed === approvedStudents.length) {
                    console.log('\n✅ All approved students synced to students table!');
                    process.exit(0);
                }
            });
        });
    }
);
