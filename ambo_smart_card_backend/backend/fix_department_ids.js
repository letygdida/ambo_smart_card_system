const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306
});

// Fix department_id for employees with 0 or null values
console.log("\n=== UPDATING EMPLOYEE DEPARTMENTS ===");

// Update AU-EMP-2026-0002 to Information Systems (department_id = 2)
db.query(`
    UPDATE employees 
    SET department_id = 2
    WHERE employee_id = 'AU-EMP-2026-0002'
`, (err, result) => {
    if (err) {
        console.error('Error updating AU-EMP-2026-0002:', err);
    } else {
        console.log('✓ Updated AU-EMP-2026-0002: department_id = 2');
    }

    // Update AU-EMP-2026-0003 to Computer Science (department_id = 1)
    db.query(`
        UPDATE employees 
        SET department_id = 1
        WHERE employee_id = 'AU-EMP-2026-0003'
    `, (err2, result2) => {
        if (err2) {
            console.error('Error updating AU-EMP-2026-0003:', err2);
        } else {
            console.log('✓ Updated AU-EMP-2026-0003: department_id = 1');
        }

        // Verify the updates
        console.log("\n=== VERIFICATION - EMPLOYEES AFTER UPDATE ===");
        db.query(`
            SELECT 
                e.employee_id,
                e.first_name,
                e.last_name,
                e.department_id,
                d.department_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY e.id
        `, (err3, results) => {
            if (err3) {
                console.error('Error fetching updated data:', err3);
            } else {
                console.table(results);
            }
            process.exit(0);
        });
    });
});
