const db = require("./backend/db");

console.log(`🔍 Checking card_status values for all students...`);

db.query(
    "SELECT id, student_id, username, card_status, role FROM users WHERE role = 'student' ORDER BY id",
    (err, results) => {
        if (err) {
            console.error("❌ Error:", err.message);
            process.exit(1);
        }

        console.log(`\n📋 Found ${results.length} students:\n`);
        
        let nullCount = 0;
        let activeCount = 0;
        let blockedCount = 0;
        
        results.forEach((row) => {
            const status = row.card_status || 'NULL';
            console.log(`ID: ${row.id.toString().padEnd(3)} | ${row.student_id.padEnd(12)} | ${row.username.padEnd(20)} | Status: ${status}`);
            
            if (!row.card_status) nullCount++;
            else if (row.card_status === 'active') activeCount++;
            else if (row.card_status === 'blocked') blockedCount++;
        });
        
        console.log(`\n📊 Summary:`);
        console.log(`  - NULL/Empty: ${nullCount}`);
        console.log(`  - Active: ${activeCount}`);
        console.log(`  - Blocked: ${blockedCount}`);
        
        if (nullCount > 0) {
            console.log(`\n🔧 Fixing ${nullCount} students with NULL card_status...`);
            
            db.query(
                "UPDATE users SET card_status = 'active' WHERE card_status IS NULL OR card_status = ''",
                (err, result) => {
                    if (err) {
                        console.error("❌ Error updating:", err.message);
                        process.exit(1);
                    }
                    
                    console.log(`✅ Updated ${result.affectedRows} records`);
                    process.exit(0);
                }
            );
        } else {
            console.log(`\n✅ All students have valid card_status!`);
            process.exit(0);
        }
    }
);
