const db = require('./db');

console.log('Adding card_status column to users table...\n');

const addColumnSql = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS card_status VARCHAR(20) DEFAULT 'active'
`;

db.query(addColumnSql, (err) => {
    if (err) {
        console.error('Error adding column:', err.message);
        process.exit(1);
    }

    console.log('✅ card_status column added successfully!');
    console.log('Default value: active');
    console.log('Possible values: active, blocked');
    
    process.exit(0);
});
