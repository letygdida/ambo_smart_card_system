const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306
});

// Check employees
console.log("\n=== EMPLOYEES DATA ===");
db.query(`
    SELECT 
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.department_id,
        d.department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.id
`, (err, results) => {
    if (err) {
        console.error('Error fetching employees:', err);
    } else {
        console.table(results);
    }

    // Check departments
    console.log("\n=== DEPARTMENTS DATA ===");
    db.query(`SELECT id, department_name FROM departments`, (err2, results2) => {
        if (err2) {
            console.error('Error fetching departments:', err2);
        } else {
            console.table(results2);
        }
        
        process.exit(0);
    });
});
