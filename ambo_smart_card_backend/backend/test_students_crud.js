const http = require('http');
const db = require('./db');

// Test token (you'll need to get a real one from login)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwidXNlcm5hbWUiOiJhZG1pbiJ9.test';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                console.log(`\n${method} ${path}`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response:`, responseData);
                resolve({ status: res.statusCode, data: responseData });
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testRoutes() {
    console.log('🧪 Testing Student CRUD Routes...\n');

    // First, get all students
    await makeRequest('GET', '/api/students');

    // Try to get student info (if any exist)
    await makeRequest('GET', '/api/students/info/2026-1234');

    // Try delete (would need real ID)
    await makeRequest('DELETE', '/api/students/1');

    // Try status update (would need real ID)
    await makeRequest('PUT', '/api/students/1/status', { status: 'blocked' });

    // Try update (would need real ID)
    await makeRequest('PUT', '/api/students/1', { 
        name: 'Test',
        department: 'CS',
        year: 1,
        smart_card_id: 'CARD-2026-0001'
    });

    console.log('\n✅ Test complete!');
}

testRoutes().catch(console.error);
