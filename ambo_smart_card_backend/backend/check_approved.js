const db = require('./db');

db.query("SELECT COUNT(*) as count FROM student_registrations WHERE registration_status='approved'", (err, result) => { 
    if(err) {
        console.error(err);
    } else {
        console.log('Approved students:', result[0].count);
        
        db.query("SELECT student_id, username, department, program, year FROM student_registrations WHERE registration_status='approved'", (err, students) => {
            if (err) {
                console.error(err);
            } else {
                console.log('\nApproved students list:');
                students.forEach(s => {
                    console.log(`- ${s.student_id}: ${s.username} (${s.department}, Year ${s.year})`);
                });
            }
            process.exit(0);
        });
    }
});
