const db = require('./db');

console.log('Adding card_request_status column to users table...\n');

const addColumnSql = `
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS card_request_status VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS card_requested_at DATETIME DEFAULT NULL
`;

db.query(addColumnSql, (err) => {
    if (err) {
        console.error('Error adding column:', err.message);
        process.exit(1);
    }

    console.log('✅ card_request_status column added successfully!');
    console.log('✅ card_requested_at column added successfully!');
    console.log('Possible values: NULL (no request), pending, approved, rejected');
    
    process.exit(0);
});
