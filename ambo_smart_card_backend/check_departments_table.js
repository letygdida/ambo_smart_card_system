const db = require('./backend/db');

console.log('Checking departments table structure...\n');

// First check if departments table exists
db.query(`
    SELECT TABLE_NAME 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = 'departments'
`, (err, result) => {
    if (err) {
        console.error('Error checking departments table:', err.message);
        process.exit(1);
    }

    if (result.length === 0) {
        console.log('Table "departments" does not exist in the database.');
        console.log('\nWe need to create the departments table first.');
        console.log('Using the schema expected by /api/departments:');
        console.log('- id (INT, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('- department_code (VARCHAR)');
        console.log('- department_name (VARCHAR)');
        console.log('- campus (VARCHAR, nullable)');
        console.log('- status (VARCHAR, default "active")');
        console.log('\nRun: node populate_departments.js --create-table');
        process.exit(0);
    }

    console.log('Table "departments" exists.\n');

    // Get table structure
    db.query('DESCRIBE departments', (err, columns) => {
        if (err) {
            console.error('Error describing departments table:', err.message);
            process.exit(1);
        }

        console.log('--- departments table structure ---');
        columns.forEach(col => {
            console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        console.log('----------------------------------\n');

        // Check existing data
        db.query('SELECT COUNT(*) as count FROM departments', (err, countResult) => {
            if (err) {
                console.error('Error counting departments:', err.message);
                process.exit(1);
            }

            console.log(`Total departments in table: ${countResult[0].count}`);

            if (countResult[0].count > 0) {
                console.log('\nExisting departments:');
                db.query('SELECT * FROM departments', (err, departments) => {
                    if (err) {
                        console.error('Error fetching departments:', err.message);
                        process.exit(1);
                    }
                    departments.forEach(dept => {
                        console.log(`  ID: ${dept.id}, Code: ${dept.code || 'N/A'}, Name: ${dept.name || 'N/A'}`);
                    });
                });
            }
        });
    });
});
