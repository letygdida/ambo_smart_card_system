const db = require("./backend/db");

console.log(`🔍 Searching for employee-format student IDs...`);

db.query(
    "SELECT id, student_id, username, role FROM users WHERE student_id LIKE 'AU-EMP%' OR student_id LIKE 'AU-%'",
    (err, results) => {
        if (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }

        if (!results || results.length === 0) {
            console.log("❌ No employee-format IDs found");
            
            // Show first 10 student IDs for reference
            db.query(
                "SELECT id, student_id, username FROM users LIMIT 20",
                (err, allIds) => {
                    if (err) {
                        console.error("Error:", err.message);
                        process.exit(1);
                    }
                    
                    console.log("\n📋 Sample student IDs in database:");
                    allIds.forEach(row => {
                        console.log(`  - ID: ${row.id}, Student ID: ${row.student_id}, Name: ${row.username}`);
                    });
                    process.exit(1);
                }
            );
            return;
        }

        console.log(`\n✓ Found ${results.length} employee-format IDs:\n`);
        results.forEach((row, idx) => {
            console.log(`${idx + 1}. ID: ${row.id}, Student ID: ${row.student_id}, Name: ${row.username}, Role: ${row.role}`);
        });
        
        process.exit(0);
    }
);
