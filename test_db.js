const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card",
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.log("❌ Database connection failed:");
        console.log(err.message);
        process.exit(1);
    }
    
    console.log("✅ MySQL Connected Successfully");
    
    // Check if student_registrations table exists
    db.query("SHOW TABLES LIKE 'student_registrations'", (err, results) => {
        if (err) {
            console.log("❌ Error checking tables:", err.message);
            db.end();
            process.exit(1);
        }
        
        if (results.length === 0) {
            console.log("❌ student_registrations table NOT found");
            console.log("📋 Need to run CREATE_REGISTRATION_TABLES.sql");
        } else {
            console.log("✅ student_registrations table exists");
        }
        
        // Check table structure
        db.query("DESCRIBE student_registrations", (err, results) => {
            if (err) {
                console.log("❌ Error describing table:", err.message);
            } else {
                console.log("📋 Table structure:");
                results.forEach(row => {
                    console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'}`);
                });
            }
            
            db.end();
            console.log("✅ Database check complete");
        });
    });
});