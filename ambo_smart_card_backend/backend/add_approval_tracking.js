const db = require('./db');

console.log('Adding approval tracking columns...\n');

const addColumnsSql = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS approved_at DATETIME DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS rejected_at DATETIME DEFAULT NULL
`;

db.query(addColumnsSql, (err) => {
    if (err) {
        console.error('Error adding columns:', err.message);
        process.exit(1);
    }

    console.log('✅ approved_by column added');
    console.log('✅ approved_at column added');
    console.log('✅ rejected_by column added');
    console.log('✅ rejected_at column added');
    console.log('\nThese columns will track:');
    console.log('- Who approved/rejected the registration');
    console.log('- When the approval/rejection happened');
    
    process.exit(0);
});
