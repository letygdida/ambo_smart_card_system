const http = require('http');

function testDashboard() {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/dashboard',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(body);
                console.log('✅ Dashboard API Response:');
                console.log('📊 Stats:', result.stats);
                console.log('\n📈 Pending Registrations:', result.stats.pendingRegistrations || 0);
                console.log('✅ Approved Registrations:', result.stats.approvedRegistrations || 0);
                console.log('❌ Rejected Registrations:', result.stats.rejectedRegistrations || 0);
                console.log('📋 Total Registrations:', result.stats.totalRegistrations || 0);
            } catch (e) {
                console.log('❌ Failed to parse response:', body);
            }
        });
    });

    req.on('error', (err) => {
        console.error('❌ Request failed:', err.message);
    });

    req.end();
}

testDashboard();