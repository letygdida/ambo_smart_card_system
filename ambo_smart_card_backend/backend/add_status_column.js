const db = require('./db');

const sql = `
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'
`;

db.query(sql, (err, result) => {
    if (err) {
        console.error('Error adding status column:', err);
        process.exit(1);
    }
    
    console.log('✓ Status column added successfully');
    
    // Update all existing students to have active status
    db.query('UPDATE students SET status = "active" WHERE status IS NULL', (err, result) => {
        if (err) {
            console.error('Error updating status:', err);
            process.exit(1);
        }
        console.log('✓ Updated', result.affectedRows, 'students to active status');
        process.exit(0);
    });
});
