const express = require("express");
const db = require("../db");

const router = express.Router();



router.get("/", (req, res) => {

    console.log('📊 Dashboard main route requested');

    const statsSQL = `
    SELECT
    (SELECT COUNT(*) FROM users WHERE role='student' AND registration_status='approved') AS totalStudents,
    (SELECT COUNT(*) FROM students WHERE smart_card_id IS NOT NULL AND smart_card_id != '') AS totalCards,
    (SELECT COUNT(*) FROM attendance) AS totalAttendance,
    (SELECT COUNT(*) FROM cards WHERE status='active') AS activeCards,
    (SELECT COUNT(*) FROM cards WHERE status='blocked') AS blockedCards,
    (SELECT COUNT(*) FROM attendance WHERE date=CURDATE()) AS todayAttendance,
    (SELECT COUNT(*) FROM users WHERE role='student' AND registration_status='pending') AS pendingRegistrations,
    (SELECT COUNT(*) FROM users WHERE role='student' AND registration_status='approved') AS approvedRegistrations,
    (SELECT COUNT(*) FROM users WHERE role='student' AND registration_status='rejected') AS rejectedRegistrations,
    (SELECT COUNT(*) FROM users WHERE role='student') AS totalRegistrations
    `;

    const chartSQL = `
    SELECT
    date,
    COUNT(*) AS count
    FROM attendance
    GROUP BY date
    ORDER BY date ASC
    `;

    db.query(statsSQL, (err, stats) => {

        if(err){
            console.log('❌ Stats query error:', err);
            return res.status(500).json({
                message:"Stats loading failed",
                error:err
            });
        }

        console.log('✓ Stats loaded:', stats[0]);

        db.query(chartSQL, (err, chart) => {

            if(err){
                console.log('❌ Chart query error:', err);
                return res.status(500).json({
                    message:"Chart loading failed",
                    error:err
                });
            }

            console.log('✓ Chart data loaded, records:', chart.length);

            res.json({
                stats: stats[0],
                chart: chart
            });

        });

    });

});



// GET Dashboard Statistics
router.get("/stats", (req, res) => {
    console.log('📊 Dashboard stats requested from:', req.headers.origin || 'unknown');
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const queries = {
        totalStudents: "SELECT COUNT(*) as count FROM users WHERE role='student' AND registration_status='approved'",
        totalCardsIssued: "SELECT COUNT(*) as count FROM students WHERE smart_card_id IS NOT NULL AND smart_card_id != ''",
        pendingRegistrations: "SELECT COUNT(*) as count FROM users WHERE role='student' AND registration_status='pending'",
        todayAttendance: "SELECT COUNT(*) as count FROM attendance WHERE DATE(date) = CURDATE()"
    };

    const stats = {
        totalStudents: 0,
        totalCardsIssued: 0,
        pendingRegistrations: 0,
        todayAttendance: 0
    };
    let completed = 0;

    Object.keys(queries).forEach(key => {
        db.query(queries[key], (err, result) => {
            if (err) {
                console.error(`❌ Error fetching ${key}:`, err.message);
                stats[key] = 0;
            } else {
                stats[key] = result[0].count;
                console.log(`✓ ${key}: ${result[0].count}`);
            }

            completed++;
            if (completed === Object.keys(queries).length) {
                console.log('📊 Sending stats:', stats);
                res.json(stats);
            }
        });
    });
});

module.exports = router;