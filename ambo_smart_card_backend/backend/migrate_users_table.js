// File: c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend\migrate_users_table.js

const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ambo_smart_card'
}).promise();

(async () => {
    try {
        await db.connect();
        console.log('✅ Connected to database');

        // Step 1: Check current users table structure
        const [userColumns] = await db.query('DESCRIBE users');
        console.log('📋 Current users table columns:', userColumns.map(row => row.Field).join(', '));

        // Step 2: Add all missing columns
        const columnsToAdd = [
            'full_name varchar(100) DEFAULT NULL',
            'university_email varchar(100) UNIQUE DEFAULT NULL',
            'personal_email varchar(100) DEFAULT NULL',
            'phone_number varchar(20) DEFAULT NULL',
            'gender varchar(10) DEFAULT NULL',
            'date_of_birth date DEFAULT NULL',
            'nationality varchar(50) DEFAULT NULL',
            'region varchar(50) DEFAULT NULL',
            'zone varchar(50) DEFAULT NULL',
            'woreda varchar(50) DEFAULT NULL',
            'address varchar(255) DEFAULT NULL',
            'university varchar(100) DEFAULT NULL',
            'campus varchar(100) DEFAULT NULL',
            'college varchar(100) DEFAULT NULL',
            'school varchar(100) DEFAULT NULL',
            'department varchar(100) DEFAULT NULL',
            'program varchar(50) DEFAULT NULL',
            'year int(11) DEFAULT NULL',
            'semester int(11) DEFAULT NULL',
            'section varchar(20) DEFAULT NULL',
            'emergency_contact_name varchar(100) DEFAULT NULL',
            'emergency_contact_relationship varchar(50) DEFAULT NULL',
            'emergency_contact_phone varchar(20) DEFAULT NULL',
            'emergency_contact_address varchar(255) DEFAULT NULL',
            'id_document varchar(255) DEFAULT NULL',
            'photo varchar(255) DEFAULT NULL',
            'profile_completed tinyint(1) DEFAULT 0'
        ];

        for (const column of columnsToAdd) {
            const columnName = column.split(' ')[0];
            const hasColumn = userColumns.some(row => row.Field === columnName);

            if (!hasColumn) {
                try {
                    await db.query(`ALTER TABLE users ADD COLUMN ${column}`);
                    console.log(`✅ Added column: ${columnName}`);
                } catch (err) {
                    if (err.message.includes('Duplicate column')) {
                        console.log(`⚠️ Column already exists: ${columnName}`);
                    } else {
                        throw err;
                    }
                }
            } else {
                console.log(`ℹ️ Column already exists: ${columnName}`);
            }
        }

        // Step 3: Add unique key on username if not exists
        try {
            await db.query('ALTER TABLE users ADD UNIQUE KEY uk_username (username)');
            console.log('✅ Added unique key on username');
        } catch (err) {
            if (err.message.includes('Duplicate key name')) {
                console.log('ℹ️ Unique key already exists on username');
            } else {
                console.log('⚠️ Could not add unique key:', err.message);
            }
        }

        // Step 4: Create indexes for faster queries
        const indexes = [
            { name: 'idx_student_id', column: 'student_id' },
            { name: 'idx_university_email', column: 'university_email' },
            { name: 'idx_department', column: 'department' },
            { name: 'idx_registration_status', column: 'registration_status' }
        ];

        for (const idx of indexes) {
            try {
                await db.query(`CREATE INDEX ${idx.name} ON users (${idx.column})`);
                console.log(`✅ Created index: ${idx.name}`);
            } catch (err) {
                if (err.message.includes('Duplicate key name')) {
                    console.log(`ℹ️ Index already exists: ${idx.name}`);
                } else {
                    console.log(`⚠️ Could not create index ${idx.name}:`, err.message);
                }
            }
        }

        // Step 5: Verify the changes
        const [finalColumns] = await db.query('DESCRIBE users');
        console.log('\n✅ MIGRATION COMPLETED!');
        console.log('📋 Final users table columns:', finalColumns.map(row => row.Field).join(', '));
        console.log('\n✨ You can now register students and save their profiles!');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await db.end();
    }
})();
