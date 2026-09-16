const db = require('./db');

console.log('Checking photo status for all students...\n');

db.query('SELECT student_id, username, full_name, photo, role FROM users WHERE role = "student" LIMIT 10', (err, results) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log(`Found ${results.length} students:\n`);
    
    results.forEach((student, index) => {
        console.log(`${index + 1}. ${student.student_id} - ${student.full_name || student.username}`);
        console.log(`   Photo: ${student.photo || 'NULL (no photo)'}\n`);
    });

    // Count students without photos
    db.query('SELECT COUNT(*) as count FROM users WHERE role = "student" AND (photo IS NULL OR photo = "")', (err, countResult) => {
        if (err) {
            console.error('Error counting:', err);
            process.exit(1);
        }
        
        console.log(`\nStudents without photos: ${countResult[0].count}`);
        process.exit(0);
    });
});
