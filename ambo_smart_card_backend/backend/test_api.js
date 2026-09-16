const http = require('http');

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        data: body ? JSON.parse(body) : body
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
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

async function testAPI() {
    try {
        // Test basic connection
        console.log('Testing basic connection...');
        const response1 = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/',
            method: 'GET'
        });
        console.log('✅ Basic connection:', response1.status, response1.data);
        
        // Test check-phone endpoint
        console.log('\nTesting check-phone endpoint...');
        const response2 = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/check-phone',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { phone: '0911234567' });
        console.log('✅ Check-phone response:', response2.status, response2.data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAPI();