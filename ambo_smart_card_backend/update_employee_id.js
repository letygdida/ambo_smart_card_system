const db = require("./backend/db");

// Update employee ID
const oldId = "AU-EMP-2026-0007";
const newId = "EMP-2026-0007";  // New employee ID format

console.log(`🔄 Converting Employee ID: ${oldId} → ${newId}`);

// First check if the record exists
db.query(
    "SELECT id, employee_id, first_name, last_name FROM employees WHERE employee_id = ?",
    [oldId],
    (err, results) => {
        if (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }

        if (!results || results.length === 0) {
            console.log(`❌ Record not found with employee ID: ${oldId}`);
            process.exit(1);
        }

        const record = results[0];
        console.log(`✓ Found employee: ${record.first_name} ${record.last_name}`);

        // Check if new ID already exists
        db.query(
            "SELECT id FROM employees WHERE employee_id = ?",
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
                    "UPDATE employees SET employee_id = ? WHERE employee_id = ?",
                    [newId, oldId],
                    (err, result) => {
                        if (err) {
                            console.error("❌ Error updating:", err.message);
                            process.exit(1);
                        }

                        console.log(`✅ Successfully updated! Affected rows: ${result.affectedRows}`);
                        console.log(`✓ Employee ID changed: ${oldId} → ${newId}`);
                        console.log(`✓ No other records were affected`);
                        process.exit(0);
                    }
                );
            }
        );
    }
);
