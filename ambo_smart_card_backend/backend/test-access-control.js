const http = require('http');

console.log('🧪 Testing Cafeteria Access Control...\n');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAccessControl() {
  console.log('1. Checking current meal status...');
  const statusResponse = await makeRequest('/api/cafeteria/meal-status');
  
  if (statusResponse.data.success) {
    const mealStatus = statusResponse.data.mealStatus;
    const anyOpen = Object.values(mealStatus).some(meal => meal.is_open);
    
    console.log(`Current time: ${statusResponse.data.currentTime}`);
    console.log(`Any meals open: ${anyOpen ? 'YES' : 'NO'}`);
    
    Object.entries(mealStatus).forEach(([meal, info]) => {
      console.log(`  ${meal}: ${info.is_open ? '✅ OPEN' : '🔒 CLOSED'} (${info.start_time} - ${info.end_time})`);
    });
    
    console.log('\n2. Testing scan when cafeteria is', anyOpen ? 'OPEN' : 'CLOSED');
    
    const scanResponse = await makeRequest('/api/cafeteria/scan', 'POST', {
      studentId: '2026-4421',
      scannerId: 'CAFT-SCANNER-001',
      verificationMethod: 'test'
    });
    
    console.log(`Scan result: ${scanResponse.status}`);
    console.log(`Response:`, JSON.stringify(scanResponse.data, null, 2));
    
    if (anyOpen) {
      console.log('\n✅ Test Result: Cafeteria is OPEN - scanning should be ALLOWED');
      if (scanResponse.status === 201) {
        console.log('✅ PASS: Scanning was allowed when cafeteria is open');
      } else if (scanResponse.status === 400 && scanResponse.data.error === 'Duplicate attendance') {
        console.log('✅ PASS: Scanning was processed but student already attended (expected)');
      } else {
        console.log('❌ FAIL: Scanning was rejected when cafeteria is open');
      }
    } else {
      console.log('\n🔒 Test Result: Cafeteria is CLOSED - scanning should be BLOCKED');
      if (scanResponse.status === 403) {
        console.log('✅ PASS: Scanning was correctly blocked when cafeteria is closed');
      } else {
        console.log('❌ FAIL: Scanning was allowed when cafeteria should be closed');
      }
    }
    
    console.log('\n3. Testing manual control to open breakfast...');
    const controlResponse = await makeRequest('/api/cafeteria/control/breakfast', 'POST', {
      action: 'open'
    });
    
    console.log(`Control result: ${controlResponse.status}`);
    if (controlResponse.status === 401) {
      console.log('ℹ️  Manual control requires admin authentication (expected)');
    } else {
      console.log('Control response:', JSON.stringify(controlResponse.data, null, 2));
    }
    
  } else {
    console.log('❌ Failed to get meal status:', statusResponse.data);
  }
  
  console.log('\n🎯 Access control test complete!');
  console.log('\n📋 How to test manually:');
  console.log('1. Go to Cafeteria Attendance Dashboard');
  console.log('2. When all meals show "CLOSED", try Manual Scan - should be blocked');
  console.log('3. Click "Open" on any meal');
  console.log('4. Try Manual Scan again - should work');
  console.log('5. Click "Close" on all meals - scanning should be blocked again');
}

testAccessControl().catch(console.error);