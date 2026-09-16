const db = require("./backend/db");

// Find and update the employee ID to student ID format
const oldId = "AU-EMP-2026-0007";
const newId = "2026/0007";  // Convert to proper student ID format

console.log(`🔄 Converting Student ID: ${oldId} → ${newId}`);

// First check if the record exists
db.query(
    "SELECT id, username, role FROM users WHERE student_id = ?",
    [oldId],
    (err, results) => {
        if (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }

        if (!results || results.length === 0) {
            console.log(`❌ Record not found with ID: ${oldId}`);
            process.exit(1);
        }

        const record = results[0];
        console.log(`✓ Found record: ${record.username} (Role: ${record.role})`);

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
                    console.log(`❌ New ID already exists: ${newId}`);
                    process.exit(1);
                }

                // Update the ID
                db.query(
                    "UPDATE users SET student_id = ? WHERE student_id = ?",
                    [newId, oldId],
                    (err, result) => {
                        if (err) {
                            console.error("❌ Error updating:", err.message);
                            process.exit(1);
                        }

                        console.log(`✅ Successfully updated! Affected rows: ${result.affectedRows}`);
                        console.log(`✓ Student ID changed: ${oldId} → ${newId}`);
                        process.exit(0);
                    }
                );
            }
        );
    }
);
