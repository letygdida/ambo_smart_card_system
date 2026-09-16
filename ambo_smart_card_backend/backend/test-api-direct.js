const http = require('http');

console.log('🧪 Testing Cafeteria API endpoints directly...\n');

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    console.log(`Testing: ${description}`);
    console.log(`URL: http://localhost:5000${path}`);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Content-Type: ${res.headers['content-type']}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
            const json = JSON.parse(data);
            console.log('Response (JSON):', JSON.stringify(json, null, 2));
          } else {
            console.log('Response (Text):', data.substring(0, 300) + (data.length > 300 ? '...' : ''));
          }
        } catch (error) {
          console.log('Response (Raw):', data.substring(0, 300));
          console.error('Parse error:', error.message);
        }
        console.log('─'.repeat(50) + '\n');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      console.log('─'.repeat(50) + '\n');
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  await testEndpoint('/api/cafeteria/test', 'Test endpoint');
  await testEndpoint('/api/cafeteria/meal-status', 'Meal status');
  await testEndpoint('/api/cafeteria/today-summary', 'Today summary');
  await testEndpoint('/api/cafeteria/records?date=2026-08-29', 'Records');
  
  console.log('🎯 Test complete!');
}

runTests().catch(console.error);