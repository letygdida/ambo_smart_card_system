const db = require('./db');

console.log("Fixing attendance table structure...\n");

// Add student_id column to attendance table
const alterSQL = `
    ALTER TABLE attendance 
    ADD COLUMN student_id VARCHAR(50) AFTER card_id
`;

db.query(alterSQL, (err, result) => {
    if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("✓ student_id column already exists");
        } else {
            console.error("Error adding column:", err.message);
            db.end();
            process.exit(1);
        }
    } else {
        console.log("✓ Added student_id column to attendance table");
    }

    // Check the structure
    db.query("DESCRIBE attendance", (err, result) => {
        if (err) {
            console.error("Error:", err);
        } else {
            console.log("\nAttendance table structure:");
            result.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(NOT NULL)'}`);
            });
        }
        
        console.log("\n✓ Attendance table is ready!");
        db.end();
    });
});
