const http = require('http');

function testLoginAPI() {
    console.log('🔐 Testing Login API...');
    
    // Test with admin credentials - using correct password
    const loginData = JSON.stringify({
        username: 'admin',
        password: '12345'  // Correct password from database
    });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };
    
    console.log('📡 Testing POST /api/auth/login');
    console.log('📋 Credentials: admin / 12345');
    
    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`📊 Response Status: ${res.statusCode}`);
            
            try {
                const result = JSON.parse(body);
                if (res.statusCode === 200) {
                    console.log('✅ Login API Working Successfully!');
                    console.log('📋 Response:', {
                        message: result.message,
                        role: result.role,
                        tokenExists: !!result.token
                    });
                } else {
                    console.log('❌ Login Failed:');
                    console.log('📋 Error:', result);
                }
            } catch (e) {
                console.log('❌ Invalid JSON Response:');
                console.log('📋 Raw Response:', body);
            }
        });
    });
    
    req.on('error', (err) => {
        console.error('❌ Request Failed:', err.message);
        console.log('💡 Make sure backend server is running on port 5000');
    });
    
    req.write(loginData);
    req.end();
    
    // Also test basic server connection
    setTimeout(() => {
        console.log('\n🌐 Testing Basic Server Connection...');
        
        const basicOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/',
            method: 'GET'
        };
        
        const basicReq = http.request(basicOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('✅ Server Basic Response:', body);
            });
        });
        
        basicReq.on('error', (err) => {
            console.error('❌ Basic Connection Failed:', err.message);
        });
        
        basicReq.end();
    }, 1000);
}

testLoginAPI();