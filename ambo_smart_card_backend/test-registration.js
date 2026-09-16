#!/usr/bin/env node

/**
 * Quick Test Script for Student Registration
 * Run this to test if the registration endpoint is working
 */

const http = require('http');

const testData = {
    username: 'testuser' + Date.now().toString().slice(-6),
    password: 'TestPassword123',
    confirm_password: 'TestPassword123'
};

console.log('\n=== Testing Student Registration Endpoint ===\n');
console.log('Test Data:');
console.log(`  Username: ${testData.username}`);
console.log(`  Password: ${testData.password}`);
console.log(`  Confirm Password: ${testData.confirm_password}\n`);

const postData = JSON.stringify(testData);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('Sending request to http://localhost:5000/api/auth/register...\n');

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}\n`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:');
        try {
            const parsed = JSON.parse(data);
            console.log(JSON.stringify(parsed, null, 2));
            
            if (res.statusCode === 200) {
                console.log('\n✓ Registration endpoint is working correctly!\n');
            } else {
                console.log(`\n✗ Error (${res.statusCode}): ${parsed.error}\n`);
            }
        } catch (e) {
            console.log(data);
            console.log('\n✗ Invalid JSON response\n');
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`✗ Connection Error: ${e.message}`);
    console.error('\nMake sure:');
    console.error('  1. Backend server is running (npm start)');
    console.error('  2. Server is on port 5000');
    console.error('  3. Database is connected\n');
    process.exit(1);
});

req.write(postData);
req.end();
