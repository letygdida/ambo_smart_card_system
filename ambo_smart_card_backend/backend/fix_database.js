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

        const [results] = await db.query('DESCRIBE student_registrations');
        const hasUsername = results.some(row => row.Field === 'username');
        const hasFullName = results.some(row => row.Field === 'full_name');
        const emailField = results.find(row => row.Field === 'university_email');

        console.log('📋 Existing student_registrations columns:', results.map(row => row.Field).join(', '));

        if (!hasUsername || !hasFullName) {
            const clauses = [];
            if (!hasUsername) clauses.push('ADD COLUMN username varchar(100) NOT NULL AFTER student_id');
            if (!hasFullName) clauses.push('ADD COLUMN full_name varchar(100) NOT NULL AFTER username');
            const alterSql = `ALTER TABLE student_registrations ${clauses.join(', ')}`;
            console.log('🔧 Altering student_registrations:', alterSql);
            await db.query(alterSql);
            console.log('✅ Added missing username/full_name columns');
        }

        if (emailField && emailField.Null === 'NO') {
            console.log('🔧 Modifying university_email column to allow NULL');
            try {
                await db.query('ALTER TABLE student_registrations DROP INDEX uk_university_email');
            } catch (err) {
                if (!err.message.includes("doesn't exist")) {
                    throw err;
                }
            }

            await db.query('ALTER TABLE student_registrations MODIFY COLUMN university_email varchar(100) NULL');
            try {
                await db.query('ALTER TABLE student_registrations ADD UNIQUE KEY uk_university_email (university_email)');
            } catch (err) {
                if (!err.message.includes('Duplicate key name')) {
                    console.log('⚠️ Warning adding unique constraint:', err.message);
                }
            }
            console.log('✅ university_email column now allows NULL');
        } else {
            console.log('✅ university_email column already allows NULL or is absent');
        }

        const [finalResults] = await db.query('DESCRIBE student_registrations');
        console.log('📋 Final student_registrations fields:', finalResults.map(row => `${row.Field}:${row.Type}`).join(', '));
        console.log('🎉 Database fix completed!');
    } catch (err) {
        console.log('❌ Database fix failed:', err.message);
        process.exit(1);
    } finally {
        await db.end();
    }
})();
