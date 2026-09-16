const db = require("./backend/db");

const searchTerm = "AU-EMP-2026-0007";

console.log(`🔍 Searching for: ${searchTerm}`);

db.query(
    `SELECT id, student_id, username, employee_id, role FROM users 
     WHERE student_id = ? OR employee_id = ? OR username LIKE ?`,
    [searchTerm, searchTerm, `%${searchTerm}%`],
    (err, results) => {
        if (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }

        if (!results || results.length === 0) {
            console.log(`\n❌ Not found in users table\n`);
            
            // Also search employees table
            db.query(
                `SELECT id, employee_id, first_name, last_name FROM employees 
                 WHERE employee_id = ? OR employee_id LIKE ?`,
                [searchTerm, `%${searchTerm}%`],
                (err, empResults) => {
                    if (err) {
                        console.error("Error:", err.message);
                        process.exit(1);
                    }
                    
                    if (!empResults || empResults.length === 0) {
                        console.log(`❌ Also not found in employees table`);
                    } else {
                        console.log(`\n✓ Found in employees table:`);
                        empResults.forEach(row => {
                            console.log(`  - Employee ID: ${row.employee_id}, Name: ${row.first_name} ${row.last_name}`);
                        });
                    }
                    
                    process.exit(empResults && empResults.length > 0 ? 0 : 1);
                }
            );
            return;
        }

        console.log(`\n✓ Found in users table:`);
        results.forEach(row => {
            console.log(`  - ID: ${row.id}`);
            console.log(`  - Student ID: ${row.student_id}`);
            console.log(`  - Employee ID: ${row.employee_id}`);
            console.log(`  - Name: ${row.username}`);
            console.log(`  - Role: ${row.role}`);
            console.log();
        });
        
        process.exit(0);
    }
);
