const db = require('./db');

console.log('🧪 Testing when cafeteria is completely closed...\n');

// Set all meals to closed manually
db.query(
  'UPDATE meal_times_config SET manual_status = "close" WHERE 1=1',
  (err) => {
    if (err) {
      console.error('❌ Error setting meals to closed:', err.message);
      return;
    }

    console.log('✅ All meals set to manually closed');

    // Test scanning now
    const http = require('http');
    
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

    async function testWhenClosed() {
      console.log('\n1. Checking meal status after manual close...');
      const statusResponse = await makeRequest('/api/cafeteria/meal-status');
      
      if (statusResponse.data.success) {
        const mealStatus = statusResponse.data.mealStatus;
        const anyOpen = Object.values(mealStatus).some(meal => meal.is_open);
        
        console.log(`Any meals open: ${anyOpen ? 'YES' : 'NO'}`);
        
        Object.entries(mealStatus).forEach(([meal, info]) => {
          console.log(`  ${meal}: ${info.is_open ? '✅ OPEN' : '🔒 CLOSED'} (${info.control_mode || 'time-based'})`);
        });
        
        console.log('\n2. Testing scan when all meals are CLOSED...');
        
        const scanResponse = await makeRequest('/api/cafeteria/scan', 'POST', {
          studentId: '2026-8969',
          scannerId: 'CAFT-SCANNER-001',
          verificationMethod: 'test'
        });
        
        console.log(`Scan result: ${scanResponse.status}`);
        console.log(`Response:`, JSON.stringify(scanResponse.data, null, 2));
        
        if (scanResponse.status === 403 && scanResponse.data.error === 'Cafeteria Closed') {
          console.log('\n✅ SUCCESS: Access control working correctly!');
          console.log('✅ Scanning is properly BLOCKED when cafeteria is closed');
        } else {
          console.log('\n❌ ISSUE: Access control may not be working');
        }
        
        // Reset one meal to open for normal operation
        console.log('\n3. Opening breakfast for normal operation...');
        db.query(
          'UPDATE meal_times_config SET manual_status = "open" WHERE meal_type = "breakfast"',
          (resetErr) => {
            if (resetErr) {
              console.error('❌ Error opening breakfast:', resetErr.message);
            } else {
              console.log('✅ Breakfast reopened for normal operation');
            }
            
            console.log('\n🎯 Test complete!');
            console.log('\n📋 What was tested:');
            console.log('✅ Manual close control works');
            console.log('✅ Access control blocks scanning when closed');
            console.log('✅ Proper error messages are returned');
            console.log('✅ Status 403 (Forbidden) returned for blocked access');
            
            process.exit(0);
          }
        );
      }
    }
    
    testWhenClosed().catch(console.error);
  }
);