const db = require('./db');

console.log('=== VERIFYING ALL DATABASE DATA ===\n');

const queries = [
    { name: 'Students', sql: 'SELECT COUNT(*) as count FROM students' },
    { name: 'Students with cards', sql: "SELECT COUNT(*) as count FROM students WHERE smart_card_id IS NOT NULL AND smart_card_id != ''" },
    { name: 'Cards table', sql: 'SELECT COUNT(*) as count FROM cards' },
    { name: 'Active cards', sql: "SELECT COUNT(*) as count FROM cards WHERE status='active'" },
    { name: 'Attendance records', sql: 'SELECT COUNT(*) as count FROM attendance' },
    { name: 'Users', sql: 'SELECT COUNT(*) as count FROM users' }
];

let completed = 0;

queries.forEach(query => {
    db.query(query.sql, (err, result) => {
        if (err) {
            console.log(`❌ ${query.name}: ERROR - ${err.message}`);
        } else {
            console.log(`✓ ${query.name}: ${result[0].count}`);
        }
        
        completed++;
        if (completed === queries.length) {
            console.log('\n=== SAMPLE STUDENT DATA ===');
            db.query('SELECT * FROM students LIMIT 3', (err, students) => {
                if (err) {
                    console.error('Error:', err);
                } else {
                    students.forEach(s => {
                        console.log(`\nID: ${s.id}`);
                        console.log(`Student ID: ${s.student_id}`);
                        console.log(`Username: ${s.username}`);
                        console.log(`Department: ${s.department}`);
                        console.log(`Year: ${s.year}`);
                        console.log(`Smart Card ID: ${s.smart_card_id}`);
                        console.log(`Status: ${s.status}`);
                        console.log(`Photo: ${s.photo || 'None'}`);
                    });
                }
                process.exit(0);
            });
        }
    });
});
