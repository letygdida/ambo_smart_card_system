const db = require("./db");

console.log("Checking students table...\n");

db.query("SELECT id, student_id, username, department, status FROM students ORDER BY id", (err, results) => {
    if (err) {
        console.error("❌ Error:", err);
        process.exit(1);
    }

    console.log(`Found ${results.length} students in table:\n`);
    console.table(results);
    
    process.exit(0);
});
