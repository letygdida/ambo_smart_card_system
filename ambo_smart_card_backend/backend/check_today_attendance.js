const db = require('./db');

db.query("SELECT COUNT(*) as count, DATE(date) as d FROM attendance WHERE DATE(date) = CURDATE() GROUP BY DATE(date)", (err, result) => { 
    if(err) {
        console.error(err);
    } else {
        console.log('Today\'s attendance (Aug 20, 2026):', result);
        
        db.query("SELECT * FROM attendance ORDER BY date DESC, time DESC LIMIT 5", (err, records) => {
            if (err) console.error(err);
            else {
                console.log('\nRecent attendance records:');
                records.forEach(r => {
                    console.log(`- ${r.student_id} on ${r.date} at ${r.time}`);
                });
            }
            process.exit(0);
        });
    }
});
