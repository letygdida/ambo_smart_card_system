const db = require('./db');

console.log('Adding status column to students table...\n');

const addColumnSql = `
    ALTER TABLE students 
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
`;

db.query(addColumnSql, (err) => {
    if (err) {
        console.error('Error adding column:', err.message);
        process.exit(1);
    }

    console.log('✅ status column added to students table!');
    console.log('Default value: active');
    console.log('Possible values: active, blocked');
    
    // Update existing students to have 'active' status
    db.query('UPDATE students SET status = "active" WHERE status IS NULL', (err, result) => {
        if (err) {
            console.error('Error updating existing records:', err.message);
        } else {
            console.log(`✅ Updated ${result.affectedRows} existing students to active status`);
        }
        process.exit(0);
    });
});
