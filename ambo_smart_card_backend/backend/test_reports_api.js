const http = require('http');

console.log("Testing /api/reports/attendance endpoint...\n");

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/reports/attendance',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Response:\n`);
        
        try {
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
                console.log(`✓ Received ${json.length} records:`);
                json.forEach((record, index) => {
                    console.log(`  ${index + 1}. ID ${record.id}: ${record.name} (${record.student_id}) - ${record.date} ${record.time}`);
                });
            } else {
                console.log("Response:", JSON.stringify(json, null, 2));
            }
        } catch (err) {
            console.log("Raw response:", data);
        }
    });
});

req.on('error', (err) => {
    console.error("Error:", err.message);
});

req.end();
