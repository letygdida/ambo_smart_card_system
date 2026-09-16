const db = require('./db');

console.log("Testing Attendance System...\n");

// 1. Check students
console.log("1. Checking students in database:");
db.query("SELECT student_id, username, department FROM students LIMIT 3", (err, students) => {
    if (err) {
        console.error("Error:", err);
        process.exit(1);
    }
    
    console.log(`Found ${students.length} students:`);
    students.forEach(s => {
        console.log(`  - ${s.student_id}: ${s.username} (${s.department})`);
    });

    if (students.length === 0) {
        console.log("\nNo students found! Please approve some registrations first.");
        db.end();
        process.exit(0);
    }

    // 2. Mark attendance for first student
    const testStudent = students[0];
    console.log(`\n2. Marking attendance for: ${testStudent.student_id}`);
    
    const insertSQL = `
        INSERT INTO attendance (student_id, date, time)
        VALUES (?, CURDATE(), CURTIME())
    `;
    
    db.query(insertSQL, [testStudent.student_id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                console.log("  ✓ Attendance already marked for this student today");
            } else {
                console.error("  ✗ Error:", err.message);
            }
        } else {
            console.log(`  ✓ Attendance marked successfully! ID: ${result.insertId}`);
        }

        // 3. Check attendance records
        console.log("\n3. Checking attendance records:");
        const reportSQL = `
            SELECT
                attendance.id,
                attendance.student_id,
                attendance.date,
                attendance.time,
                students.username as name,
                students.department,
                students.year,
                students.smart_card_id
            FROM attendance
            LEFT JOIN students ON attendance.student_id = students.student_id
            ORDER BY attendance.id DESC
            LIMIT 5
        `;
        
        db.query(reportSQL, (err, records) => {
            if (err) {
                console.error("Error:", err);
            } else {
                console.log(`Found ${records.length} attendance records:`);
                records.forEach(r => {
                    console.log(`  - ID ${r.id}: ${r.name} (${r.student_id}) on ${r.date} at ${r.time}`);
                });
            }
            
            console.log("\n✓ Test completed!");
            db.end();
        });
    });
});
