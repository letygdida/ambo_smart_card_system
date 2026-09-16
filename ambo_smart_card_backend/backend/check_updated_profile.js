const db = require('./db');

const studentId = '2026-4795'; // Gemechu Abe

console.log(`Checking profile for student: ${studentId}\n`);

db.query('SELECT student_id, username, full_name, photo, department, year, phone_number, profile_completed FROM users WHERE student_id = ?', [studentId], (err, results) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    if (results.length === 0) {
        console.log('Student not found!');
        process.exit(1);
    }

    const student = results[0];
    console.log('=== STUDENT PROFILE ===');
    console.log(`Student ID: ${student.student_id}`);
    console.log(`Username: ${student.username}`);
    console.log(`Full Name: ${student.full_name || 'NULL'}`);
    console.log(`Department: ${student.department || 'NULL'}`);
    console.log(`Year: ${student.year || 'NULL'}`);
    console.log(`Phone: ${student.phone_number || 'NULL'}`);
    console.log(`Photo: ${student.photo || 'NULL'}`);
    console.log(`Profile Completed: ${student.profile_completed ? 'YES' : 'NO'}`);

    process.exit(0);
});
