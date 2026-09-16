const mysql = require('mysql2');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'ambo_smart_card'
});

db.connect(() => {
    console.log('📊 Checking students table...');
    db.query('SELECT * FROM students ORDER BY id DESC LIMIT 3', (err, results) => {
        if (err) {
            console.log('❌ Error:', err.message);
        } else {
            console.log('✅ Recent students:');
            results.forEach(student => {
                console.log(`   - ID: ${student.id}, Student ID: ${student.student_id}, Name: ${student.name}, Department: ${student.department}`);
            });
        }
        db.end();
    });
});