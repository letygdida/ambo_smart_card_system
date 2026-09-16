const mysql = require("mysql2");

// Create connection
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ambo_smart_card"
});

connection.connect((err) => {
    if (err) {
        console.error("Connection error:", err);
        process.exit(1);
    }
    console.log("✓ Connected to database");

    // Add admin settings columns if they don't exist
    const alterTableSQL = `
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT 1 AFTER role,
        ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT 0 AFTER email_notifications,
        ADD COLUMN IF NOT EXISTS two_factor_auth BOOLEAN DEFAULT 0 AFTER sms_notifications,
        ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT 0 AFTER two_factor_auth,
        ADD COLUMN IF NOT EXISTS auto_logout BOOLEAN DEFAULT 1 AFTER dark_mode,
        ADD COLUMN IF NOT EXISTS auto_logout_minutes INT DEFAULT 30 AFTER auto_logout
    `;

    connection.query(alterTableSQL, (err) => {
        if (err) {
            console.error("Error adding columns:", err);
        } else {
            console.log("✓ Admin settings columns added successfully to users table");
        }
        connection.end();
        process.exit(err ? 1 : 0);
    });
});
