const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306
});

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║       EMPLOYEE DEPARTMENT DISPLAY TEST              ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

// 1. Check Departments
console.log("1️⃣  DEPARTMENTS IN DATABASE:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
db.query(`SELECT id, department_code, department_name FROM departments ORDER BY id`, (err, results) => {
    if (err) {
        console.error('❌ Error fetching departments:', err);
    } else {
        console.table(results);
    }

    // 2. Check Employees with Departments (using LEFT JOIN)
    console.log("\n2️⃣  EMPLOYEES WITH DEPARTMENT NAMES (LEFT JOIN):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    db.query(`
        SELECT 
            e.employee_id,
            e.first_name,
            e.last_name,
            e.department_id,
            d.department_name,
            e.position,
            e.employment_status
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        ORDER BY e.id
    `, (err2, results2) => {
        if (err2) {
            console.error('❌ Error fetching employees:', err2);
        } else {
            console.table(results2);
        }

        // 3. Verify each employee has valid department
        console.log("\n3️⃣  VERIFICATION STATUS:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        let issuesFound = false;
        results2.forEach((emp, idx) => {
            const status = emp.department_name ? '✅' : '❌';
            const deptDisplay = emp.department_name || 'NULL (NO DEPARTMENT ASSIGNED)';
            console.log(`${status} ${emp.employee_id}: ${emp.first_name} ${emp.last_name}`);
            console.log(`   └─ Department: ${deptDisplay}`);
            
            if (!emp.department_name) {
                issuesFound = true;
            }
        });

        console.log("\n4️⃣  SUMMARY:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        const withDept = results2.filter(e => e.department_name).length;
        const total = results2.length;
        
        console.log(`Total Employees: ${total}`);
        console.log(`With Department: ${withDept} ✅`);
        console.log(`Missing Department: ${total - withDept} ${issuesFound ? '❌' : '✅'}`);
        
        if (issuesFound) {
            console.log("\n⚠️  ISSUES FOUND:");
            console.log("  - Some employees have department_id = 0 or NULL");
            console.log("  - These employees will show 'N/A' on ID cards");
            console.log("  - Fix by assigning valid department_id values");
        } else {
            console.log("\n✅ ALL EMPLOYEES HAVE DEPARTMENTS ASSIGNED!");
        }

        console.log("\n");
        process.exit(0);
    });
});
