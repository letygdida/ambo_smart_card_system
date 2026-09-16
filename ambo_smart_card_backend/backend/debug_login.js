// Simple direct database test for login
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'ambo_smart_card'
});

console.log('🔍 Debugging Login Issue...');

db.connect((err) => {
    if (err) {
        console.log('❌ Database connection failed:', err.message);
        return;
    }
    
    console.log('✅ Database connected');
    
    // Test the exact query used in login
    const sql = "SELECT * FROM users WHERE username=?";
    const loginName = "admin";
    
    console.log('🔍 Testing login query:', sql);
    console.log('📋 Parameter:', loginName);
    
    db.query(sql, [loginName], (err, result) => {
        if (err) {
            console.log('❌ Query failed:', err.message);
            console.log('📋 Error details:', err);
        } else {
            console.log('✅ Query successful');
            console.log('📋 Results count:', result.length);
            
            if (result.length > 0) {
                const user = result[0];
                console.log('👤 Found user:');
                console.log('   - ID:', user.id);
                console.log('   - Username:', user.username);
                console.log('   - Role:', user.role);
                console.log('   - Actual password:', `"${user.password}"`);
                console.log('   - Expected password:', `"admin123"`);
                console.log('   - Password matches "admin123":', user.password === 'admin123');
            }
        }
        
        db.end();
    });
});