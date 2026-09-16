const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'ambo_smart_card'
});

console.log('🔌 Testing Database Connection...');

db.connect((err) => {
    if (err) {
        console.log('❌ Database Connection Failed:');
        console.log('   Error:', err.message);
        console.log('   Code:', err.code);
        process.exit(1);
    }
    
    console.log('✅ Database Connected Successfully');
    
    // Test users table
    console.log('\n📋 Testing Users Table...');
    db.query('SELECT COUNT(*) as userCount FROM users', (err, results) => {
        if (err) {
            console.log('❌ Users table error:', err.message);
            
            // Try to create a default admin user
            console.log('\n🔧 Creating default admin user...');
            const createUserSql = `INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`;
            
            db.query(createUserSql, (err, result) => {
                if (err) {
                    console.log('❌ Failed to create admin user:', err.message);
                } else {
                    console.log('✅ Default admin user created successfully');
                    console.log('   Username: admin');
                    console.log('   Password: admin123');
                }
                checkTables();
            });
        } else {
            console.log(`✅ Users table exists with ${results[0].userCount} users`);
            
            // Show existing users
            db.query('SELECT id, username, role FROM users LIMIT 5', (err, users) => {
                if (!err && users.length > 0) {
                    console.log('📋 Existing users:');
                    users.forEach(user => {
                        console.log(`   - ${user.username} (${user.role})`);
                    });
                }
                checkTables();
            });
        }
    });
});

function checkTables() {
    // Check other important tables
    console.log('\n📊 Checking Other Tables...');
    
    const tables = ['students', 'student_registrations', 'cards'];
    let checkedTables = 0;
    
    tables.forEach(tableName => {
        db.query(`SELECT COUNT(*) as count FROM ${tableName}`, (err, results) => {
            if (err) {
                console.log(`❌ ${tableName} table: ${err.message}`);
            } else {
                console.log(`✅ ${tableName} table: ${results[0].count} records`);
            }
            
            checkedTables++;
            if (checkedTables === tables.length) {
                console.log('\n🎯 Database Status Complete');
                db.end();
            }
        });
    });
}