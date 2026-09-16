const db = require("./db");

console.log("Checking data sync between users and students tables...\n");

// Get all approved students from users table
db.query(
    "SELECT id, student_id, username, full_name FROM users WHERE role='student' AND registration_status='approved' ORDER BY id",
    (err, usersResults) => {
        if (err) {
            console.error("❌ Error fetching users:", err);
            process.exit(1);
        }

        console.log(`📊 Users table (approved students): ${usersResults.length} records`);
        console.table(usersResults);

        // Get all students from students table
        db.query(
            "SELECT id, student_id, username FROM students ORDER BY id",
            (err, studentsResults) => {
                if (err) {
                    console.error("❌ Error fetching students:", err);
                    process.exit(1);
                }

                console.log(`\n📊 Students table: ${studentsResults.length} records`);
                console.table(studentsResults);

                // Find mismatches
                console.log("\n🔍 Checking for mismatches...");
                const studentIds = new Set(studentsResults.map(s => s.student_id));
                
                usersResults.forEach(user => {
                    if (!studentIds.has(user.student_id)) {
                        console.log(`❌ MISMATCH: User ID ${user.id} (${user.username}, ${user.student_id}) exists in users but NOT in students table`);
                    }
                });

                process.exit(0);
            }
        );
    }
);
