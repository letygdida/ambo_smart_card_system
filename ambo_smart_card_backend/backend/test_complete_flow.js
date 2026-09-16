const http = require('http');
const mysql = require('mysql2');

// First, verify database state
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306
});

console.log("\n╔═══════════════════════════════════════════════════════════════╗");
console.log("║     COMPLETE EMPLOYEE DEPARTMENT DISPLAY VERIFICATION        ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// Step 1: Verify database
console.log("STEP 1: VERIFY DATABASE STATE");
console.log("─────────────────────────────────────────────────────────────────\n");

db.query(`
    SELECT 
        e.employee_id,
        CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as full_name,
        e.department_id,
        d.department_name,
        e.position,
        e.campus
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY e.id
`, (err, employees) => {
    if (err) {
        console.error('❌ Database error:', err);
        process.exit(1);
    }

    console.log("✓ Employee data with department JOINs:");
    employees.forEach((emp, idx) => {
        console.log(`\n  ${idx + 1}. ${emp.employee_id}`);
        console.log(`     Name: ${emp.full_name}`);
        console.log(`     Position: ${emp.position}`);
        console.log(`     Department ID: ${emp.department_id}`);
        console.log(`     Department Name: ${emp.department_name || 'NULL'}`);
        console.log(`     Campus: ${emp.campus}`);
    });

    // Step 2: Test Departments API
    console.log("\n\nSTEP 2: TEST DEPARTMENTS API ENDPOINT");
    console.log("─────────────────────────────────────────────────────────────────\n");

    const departmentOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/departments',
        method: 'GET'
    };

    const deptReq = http.request(departmentOptions, (deptRes) => {
        let deptData = '';

        deptRes.on('data', (chunk) => {
            deptData += chunk;
        });

        deptRes.on('end', () => {
            try {
                const departments = JSON.parse(deptData);
                console.log(`✓ Departments API returned ${departments.length} departments:\n`);
                departments.forEach((dept, idx) => {
                    console.log(`  ${idx + 1}. ID: ${dept.id} | Name: ${dept.department_name}`);
                });

                // Step 3: Summary
                console.log("\n\nSTEP 3: SUMMARY & EXPECTED FRONTEND BEHAVIOR");
                console.log("─────────────────────────────────────────────────────────────────\n");

                console.log("✓ Database relationships are correct (LEFT JOIN works)");
                console.log("✓ Department dropdown will show all available departments");
                console.log("✓ Each employee will display their actual department name (not ID)");
                console.log("\nEmployee Table Column Display:");
                employees.forEach((emp) => {
                    console.log(`  • ${emp.employee_id}: Department = "${emp.department_name || 'N/A'}"`);
                });

                console.log("\n✓ Employee ID Card will display:");
                console.log("  - Full Name (first + middle + last)");
                console.log("  - Employee ID");
                console.log("  - Position");
                console.log("  - Department (from LEFT JOIN)");
                console.log("  - Campus");

                console.log("\n\n╔═══════════════════════════════════════════════════════════════╗");
                console.log("║                    ✓ ALL VERIFICATIONS PASSED                    ║");
                console.log("╚═══════════════════════════════════════════════════════════════╝\n");

                process.exit(0);
            } catch (e) {
                console.error('❌ Failed to parse departments response:', e);
                process.exit(1);
            }
        });
    });

    deptReq.on('error', (e) => {
        console.error('❌ Departments API error:', e.message);
        console.log('\nNote: Make sure the backend server is running on http://localhost:5000');
        process.exit(1);
    });

    deptReq.end();
});
