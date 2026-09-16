const db = require('./db');

console.log("Removing UNIQUE constraint from university_email column...\n");

// First, check if there's a unique constraint
const checkConstraintSQL = `
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'ambo_smart_card' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'university_email'
    AND CONSTRAINT_NAME != 'PRIMARY'
`;

db.query(checkConstraintSQL, (err, results) => {
    if (err) {
        console.error("Error checking constraints:", err);
        db.end();
        process.exit(1);
    }

    console.log("Found constraints:", results);

    if (results.length > 0) {
        // Drop the unique constraint
        const constraintName = results[0].CONSTRAINT_NAME;
        console.log(`\nDropping constraint: ${constraintName}`);
        
        const dropConstraintSQL = `ALTER TABLE users DROP INDEX ${constraintName}`;
        
        db.query(dropConstraintSQL, (err, result) => {
            if (err) {
                console.error("Error dropping constraint:", err);
            } else {
                console.log("✓ Successfully removed UNIQUE constraint from university_email");
                console.log("✓ Multiple students can now use registrar@ambou.edu.et");
            }
            db.end();
        });
    } else {
        console.log("✓ No UNIQUE constraint found on university_email column");
        console.log("✓ Multiple students can already use the same email");
        db.end();
    }
});
