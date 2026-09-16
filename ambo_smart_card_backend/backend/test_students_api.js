const db = require('./db');

console.log('Testing students API query...\n');

db.query('SELECT * FROM students', (err, result) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }
    
    console.log('✓ Found', result.length, 'students\n');
    
    if (result.length > 0) {
        console.log('Sample student data:');
        console.log(JSON.stringify(result[0], null, 2));
        
        console.log('\nAll students:');
        result.forEach(s => {
            console.log(`- ${s.student_id}: ${s.name} (${s.department}) - Card: ${s.smart_card_id || 'None'} - Status: ${s.status || 'N/A'}`);
        });
    }
    
    process.exit(0);
});
