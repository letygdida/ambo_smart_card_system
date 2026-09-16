const db = require("./backend/db");

// Update employee ID in users table as well
const oldId = "AU-EMP-2026-0007";
const newId = "EMP-2026-0007";

console.log(`🔄 Updating Employee ID in users table: ${oldId} → ${newId}`);

// Check if record exists in users table
db.query(
    "SELECT id, username, student_id, role FROM users WHERE student_id = ?",
    [oldId],
    (err, results) => {
        if (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }

        if (!results || results.length === 0) {
            console.log(`ℹ️  No record found in users table with ID: ${oldId}`);
            console.log(`ℹ️  This is OK - the employee may only be in the employees table`);
            process.exit(0);
        }

        const record = results[0];
        console.log(`✓ Found in users table: ${record.username} (Role: ${record.role})`);

        // Check if new ID already exists
        db.query(
            "SELECT id FROM users WHERE student_id = ?",
            [newId],
            (err, existing) => {
                if (err) {
                    console.error("❌ Error:", err.message);
                    process.exit(1);
                }

                if (existing && existing.length > 0) {
                    console.log(`⚠️  New ID already exists in users table: ${newId}`);
                    process.exit(1);
                }

                // Update the ID in users table
                db.query(
                    "UPDATE users SET student_id = ? WHERE student_id = ?",
                    [newId, oldId],
                    (err, result) => {
                        if (err) {
                            console.error("❌ Error updating:", err.message);
                            process.exit(1);
                        }

                        console.log(`✅ Successfully updated users table! Affected rows: ${result.affectedRows}`);
                        console.log(`✓ Employee ID changed in users: ${oldId} → ${newId}`);
                        process.exit(0);
                    }
                );
            }
        );
    }
);
