const http = require('http');

console.log('🧪 Testing fixed cafeteria scanning...\n');

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

async function testScanFixed() {
  console.log('1. Checking current meal status...');
  const statusResponse = await makeRequest('/api/cafeteria/meal-status');
  
  if (statusResponse.data && statusResponse.data.success) {
    const mealStatus = statusResponse.data.mealStatus;
    const anyOpen = Object.values(mealStatus).some(meal => meal.is_open);
    
    console.log(`Current time: ${statusResponse.data.currentTime}`);
    console.log(`Any meals open: ${anyOpen ? 'YES ✅' : 'NO 🔒'}`);
    
    Object.entries(mealStatus).forEach(([meal, info]) => {
      console.log(`  ${meal}: ${info.is_open ? '✅ OPEN' : '🔒 CLOSED'} (${info.control_mode || 'time-based'})`);
    });
    
    console.log('\n2. Testing scan with student 2026-8847...');
    
    const scanResponse = await makeRequest('/api/cafeteria/scan', 'POST', {
      studentId: '2026-8847',
      scannerId: 'CAFT-SCANNER-001',
      verificationMethod: 'manual'
    });
    
    console.log(`Scan result: ${scanResponse.status}`);
    console.log('Response:', JSON.stringify(scanResponse.data, null, 2));
    
    // Analyze the result
    if (scanResponse.status === 201) {
      console.log('\n✅ SUCCESS: Student attendance recorded successfully');
    } else if (scanResponse.status === 400 && scanResponse.data.error === 'Duplicate attendance') {
      console.log('\n⚠️  EXPECTED: Student already attended this meal today');
    } else if (scanResponse.status === 403) {
      console.log('\n🔒 EXPECTED: Cafeteria is closed, scanning blocked');
    } else if (scanResponse.status === 404) {
      console.log('\n❌ Student not found - checking if student exists...');
      
      // Try with a student we know exists
      console.log('\n3. Testing with known student 2026-4421...');
      const scanResponse2 = await makeRequest('/api/cafeteria/scan', 'POST', {
        studentId: '2026-4421',
        scannerId: 'CAFT-SCANNER-001',
        verificationMethod: 'manual'
      });
      
      console.log(`Second scan result: ${scanResponse2.status}`);
      console.log('Second response:', JSON.stringify(scanResponse2.data, null, 2));
    } else {
      console.log('\n❌ UNEXPECTED RESULT');
    }
    
  } else {
    console.log('❌ Failed to get meal status');
  }
  
  console.log('\n🎯 Test complete!');
  console.log('\n📝 Key Points:');
  console.log('- Status 201: Successfully recorded attendance');
  console.log('- Status 400: Duplicate (already attended)');  
  console.log('- Status 403: Cafeteria closed');
  console.log('- Status 404: Student not found');
  console.log('- Status 500: Database/server error');
}

testScanFixed().catch(console.error);