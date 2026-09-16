const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('./db');

console.log('\n========== API ENDPOINT TEST ==========\n');

// First, let's check the students table schema
db.query("DESCRIBE students", (err, schema) => {
    if (err) {
        console.error('❌ Error getting students table schema:', err);
        // Continue anyway
    } else {
        console.log('Students table schema:');
        schema.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });
    }
    
    // Try to get students with the actual schema
    db.query(
        `SELECT * FROM students LIMIT 1`,
        (err, results) => {
            if (err) {
                console.error('❌ Error querying database:', err);
                process.exit(1);
            }

            console.log(`\nFound ${results.length} students in database`);
        
            if (results.length > 0) {
                console.log('\nSample student from database:');
                console.log(JSON.stringify(results[0], null, 2));
                console.log('\nStudent object keys:', Object.keys(results[0]));
            }

            // Now let's get an admin user to generate a token
            db.query(
                "SELECT id, username, role, student_id FROM users WHERE role = 'admin' LIMIT 1",
                (err, adminResults) => {
                    if (err) {
                        console.error('❌ Error querying admin user:', err);
                        process.exit(1);
                    }

                    if (adminResults.length === 0) {
                        console.error('❌ No admin user found. Creating a test token with sample data...');
                        testAPIWithToken('admin_user', 'admin', null);
                        return;
                    }

                    const admin = adminResults[0];
                    console.log(`\n✓ Using admin user: ${admin.username}`);
                    testAPIWithToken(admin.username, admin.role, admin.id);
                }
            );
        }
    );
});

function testAPIWithToken(username, role, userId) {
    // Create JWT token (valid for 1 hour)
    const token = jwt.sign(
        {
            id: userId || 1,
            username: username,
            role: role,
            student_id: null
        },
        "smartcard_secret",
        { expiresIn: "1h" }
    );

    console.log(`\n✓ Generated JWT Token: ${token.substring(0, 50)}...`);
    console.log(`\n🔍 Making GET request to http://localhost:5000/api/students`);
    console.log(`   Authorization: Bearer ${token.substring(0, 50)}...`);
    console.log(`   Headers:`, {
        'Authorization': `Bearer ${token.substring(0, 50)}...`,
        'Content-Type': 'application/json'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/students',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('\n========== RESPONSE ==========\n');
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            try {
                const jsonData = JSON.parse(data);
                console.log(`\n✓ Response is valid JSON`);
                console.log(`✓ Number of students returned: ${jsonData.length}`);
                
                if (jsonData.length > 0) {
                    console.log('\n--- FIRST STUDENT IN RESPONSE ---');
                    console.log(JSON.stringify(jsonData[0], null, 2));
                    
                    console.log('\n--- CHECKING FOR REQUIRED FIELDS ---');
                    const student = jsonData[0];
                    const requiredFields = [
                        'personal_email',
                        'emergency_contact_phone',
                        'id',
                        'student_id',
                        'username',
                        'department',
                        'year',
                        'smart_card_id',
                        'photo',
                        'status'
                    ];

                    requiredFields.forEach(field => {
                        const value = student[field];
                        const status = value !== undefined ? '✓' : '❌';
                        console.log(`  ${status} ${field}: ${value !== undefined ? value : 'MISSING'}`);
                    });

                    console.log('\n--- ALL FIELDS IN RESPONSE ---');
                    Object.keys(student).forEach(key => {
                        console.log(`  - ${key}: ${student[key]}`);
                    });
                } else {
                    console.log('\n⚠️  No students in response (database may not have approved students)');
                }

                console.log('\n========== END OF RESPONSE ==========\n');
                db.end();
                process.exit(0);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON response:', parseError);
                console.log('Raw response:', data);
                db.end();
                process.exit(1);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Request error:', error);
        console.log('\n⚠️  Make sure the backend server is running on port 5000');
        db.end();
        process.exit(1);
    });

    req.end();
}
