const http = require('http');
const db = require('./db');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Test user credentials
const TEST_USER = {
    username: 'admin',
    password: 'admin123'
};

let authToken = null;
let testStudentId = null;

// Helper to make HTTP requests
function makeRequest(method, path, data = null, customHeaders = {}) {
    return new Promise((resolve, reject) => {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: headers
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const parsed = responseData ? JSON.parse(responseData) : {};
                    resolve({
                        status: res.statusCode,
                        data: parsed,
                        raw: responseData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: { error: 'Invalid JSON response' },
                        raw: responseData
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test sequence
async function runTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║     STUDENT MANAGEMENT CRUD COMPLETE TEST SUITE           ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

    try {
        // Step 1: Get Authentication Token
        log('\n[TEST 1] Getting authentication token...', 'yellow');
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            username: TEST_USER.username,
            password: TEST_USER.password
        });

        if (loginRes.status !== 200) {
            log(`❌ Login failed: ${loginRes.status}`, 'red');
            log(`Response: ${JSON.stringify(loginRes.data)}`, 'red');
            return;
        }

        authToken = loginRes.data.token;
        log(`✅ Authentication successful. Token received.`, 'green');

        // Step 2: Get all students before adding
        log('\n[TEST 2] Getting all students...', 'yellow');
        const studentsRes = await makeRequest('GET', '/api/students');

        if (studentsRes.status === 200) {
            log(`✅ Found ${studentsRes.data.length} students in database`, 'green');
            if (studentsRes.data.length > 0) {
                testStudentId = studentsRes.data[0].id;
                log(`   Using first student (ID: ${testStudentId}) for testing`, 'blue');
            }
        } else {
            log(`❌ Failed to get students: ${studentsRes.status}`, 'red');
            return;
        }

        // Step 3: Add a new student
        log('\n[TEST 3] Adding new student...', 'yellow');
        const newStudentData = {
            student_id: `TEST-${Date.now().toString().slice(-4)}/2026`,
            name: `Test Student ${Date.now()}`,
            department: 'Computer Science',
            year: 1,
            smart_card_id: `CARD-2026-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        };

        const addRes = await makeRequest('POST', '/api/students/add', newStudentData);

        if (addRes.status === 200) {
            testStudentId = addRes.data.id;
            log(`✅ Student added successfully (ID: ${testStudentId})`, 'green');
            log(`   Student ID: ${newStudentData.student_id}`, 'blue');
            log(`   Name: ${newStudentData.name}`, 'blue');
        } else {
            log(`❌ Failed to add student: ${addRes.status}`, 'red');
            log(`   Response: ${JSON.stringify(addRes.data)}`, 'red');
            return;
        }

        // Step 4: Verify student was added
        log('\n[TEST 4] Verifying student was added...', 'yellow');
        const verifyRes = await makeRequest('GET', '/api/students');
        if (verifyRes.status === 200 && verifyRes.data.some(s => s.id === testStudentId)) {
            log(`✅ Student verified in database`, 'green');
        } else {
            log(`❌ Failed to verify student`, 'red');
        }

        // Step 5: Update/Edit student
        log('\n[TEST 5] Updating student...', 'yellow');
        const updateData = {
            name: `Updated ${newStudentData.name}`,
            department: 'Civil Engineering',
            year: 2,
            smart_card_id: newStudentData.smart_card_id
        };

        const updateRes = await makeRequest('PUT', `/api/students/${testStudentId}`, updateData);

        if (updateRes.status === 200 && updateRes.data.success) {
            log(`✅ Student updated successfully`, 'green');
            log(`   New Name: ${updateData.name}`, 'blue');
            log(`   New Department: ${updateData.department}`, 'blue');
            log(`   New Year: ${updateData.year}`, 'blue');
        } else {
            log(`❌ Failed to update student: ${updateRes.status}`, 'red');
            log(`   Response: ${JSON.stringify(updateRes.data)}`, 'red');
        }

        // Step 6: Block student
        log('\n[TEST 6] Blocking student...', 'yellow');
        const blockRes = await makeRequest('PUT', `/api/students/${testStudentId}/status`, { status: 'blocked' });

        if (blockRes.status === 200 && blockRes.data.success) {
            log(`✅ Student blocked successfully`, 'green');
            log(`   New Status: blocked`, 'blue');
        } else {
            log(`❌ Failed to block student: ${blockRes.status}`, 'red');
            log(`   Response: ${JSON.stringify(blockRes.data)}`, 'red');
        }

        // Step 7: Verify student is blocked
        log('\n[TEST 7] Verifying student is blocked...', 'yellow');
        const studentsCheck = await makeRequest('GET', '/api/students');
        const blockedStudent = studentsCheck.data.find(s => s.id === testStudentId);
        if (blockedStudent && blockedStudent.status === 'blocked') {
            log(`✅ Student status verified as blocked`, 'green');
        } else {
            log(`❌ Student status not updated or student not found`, 'red');
        }

        // Step 8: Unblock student
        log('\n[TEST 8] Unblocking student...', 'yellow');
        const unblockRes = await makeRequest('PUT', `/api/students/${testStudentId}/status`, { status: 'active' });

        if (unblockRes.status === 200 && unblockRes.data.success) {
            log(`✅ Student unblocked successfully`, 'green');
            log(`   New Status: active`, 'blue');
        } else {
            log(`❌ Failed to unblock student: ${unblockRes.status}`, 'red');
            log(`   Response: ${JSON.stringify(unblockRes.data)}`, 'red');
        }

        // Step 9: Delete student
        log('\n[TEST 9] Deleting student...', 'yellow');
        const deleteRes = await makeRequest('DELETE', `/api/students/${testStudentId}`);

        if (deleteRes.status === 200 && deleteRes.data.success) {
            log(`✅ Student deleted successfully`, 'green');
        } else {
            log(`❌ Failed to delete student: ${deleteRes.status}`, 'red');
            log(`   Response: ${JSON.stringify(deleteRes.data)}`, 'red');
        }

        // Step 10: Verify student was deleted
        log('\n[TEST 10] Verifying student was deleted...', 'yellow');
        const finalCheck = await makeRequest('GET', '/api/students');
        if (finalCheck.status === 200 && !finalCheck.data.some(s => s.id === testStudentId)) {
            log(`✅ Student deletion verified`, 'green');
        } else {
            log(`❌ Student still exists in database`, 'red');
        }

        log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
        log('║                   ALL TESTS COMPLETED                      ║', 'blue');
        log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

    } catch (error) {
        log(`\n❌ Test error: ${error.message}`, 'red');
        console.error(error);
    }

    process.exit(0);
}

// Run tests
runTests();
