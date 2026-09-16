const db = require('./db');

console.log('Syncing Teferi Guteta to students table...\n');

// Get Teferi's data
db.query(
    "SELECT * FROM users WHERE student_id='2026-8042'",
    (err, results) => {
        if (err || results.length === 0) {
            console.error('Student not found');
            process.exit(1);
        }

        const student = results[0];
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
        ], (err) => {
            if (err) {
                console.error('Error:', err);
                process.exit(1);
            }

            console.log(`✅ Teferi Guteta synced successfully!`);
            console.log(`   Student ID: ${student.student_id}`);
            console.log(`   Card ID: ${cardId}`);
            console.log(`   Department: ${student.department}`);
            console.log(`   Year: ${student.year}`);
            process.exit(0);
        });
    }
);
