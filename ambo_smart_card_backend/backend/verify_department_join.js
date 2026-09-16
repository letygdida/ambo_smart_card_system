const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306
});

console.log("\n=== VERIFYING EMPLOYEE-DEPARTMENT JOIN ===\n");

// Test 1: GET all employees with departments
console.log("TEST 1: All Employees with Departments");
console.log("Query: SELECT e.*, d.department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id\n");

db.query(`
    SELECT 
        e.employee_id,
        CONCAT(e.first_name, ' ', e.middle_name, ' ', e.last_name) as full_name,
        e.department_id,
        d.department_name,
        e.position,
        e.employee_type,
        e.campus
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.id
`, (err, results) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.table(results);
    }

    // Test 2: GET single employee with department
    console.log("\n\nTEST 2: Single Employee (AU-EMP-2026-0002) with Department");
    console.log("Query: SELECT e.*, d.department_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id WHERE e.employee_id = ?\n");

    db.query(`
        SELECT 
            e.id,
            e.employee_id,
            e.first_name,
            e.middle_name,
            e.last_name,
            e.email,
            e.phone,
            e.photo,
            e.employee_type,
            e.position,
            e.department_id,
            d.department_name,
            e.campus,
            e.employment_status,
            e.card_status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.employee_id = 'AU-EMP-2026-0002'
    `, (err2, results2) => {
        if (err2) {
            console.error('Error:', err2);
        } else {
            console.log("Result for AU-EMP-2026-0002:");
            console.table(results2);
            
            if (results2.length > 0) {
                const emp = results2[0];
                console.log("\n--- Formatted Output for Frontend ---");
                console.log(`Full Name: ${emp.first_name} ${emp.middle_name || ''} ${emp.last_name}`);
                console.log(`Employee ID: ${emp.employee_id}`);
                console.log(`Department ID (DB): ${emp.department_id}`);
                console.log(`Department Name (UI): ${emp.department_name || 'N/A'}`);
                console.log(`Position: ${emp.position}`);
                console.log(`Employee Type: ${emp.employee_type}`);
                console.log(`Campus: ${emp.campus}`);
                console.log(`Employment Status: ${emp.employment_status}`);
            }
        }

        // Test 3: Check departments table
        console.log("\n\nTEST 3: Available Departments");
        db.query('SELECT id, department_code, department_name FROM departments ORDER BY id', (err3, results3) => {
            if (err3) {
                console.error('Error:', err3);
            } else {
                console.table(results3);
            }

            process.exit(0);
        });
    });
});
