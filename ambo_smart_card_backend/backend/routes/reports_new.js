const express = require("express");
const db = require("../db");

const router = express.Router();

console.log("✓ Loading UPDATED reports.js route with student_id support");

// Attendance report
router.get("/attendance",(req,res)=>{

    console.log("Reports /attendance endpoint called");
    
    const {date} = req.query;

    let sql = `
    SELECT
        attendance.id,
        attendance.student_id,
        attendance.attendance_date as date,
        attendance.check_in_time as time,
        users.full_name as name,
        users.department,
        users.year,
        attendance.person_name,
        attendance.attendance_status,
        attendance.person_type
    FROM attendance
    LEFT JOIN users
        ON attendance.student_id = users.student_id
    WHERE attendance.person_type = 'student'
    `;

    let params=[];

    if(date){
        sql += " AND attendance.attendance_date=?";
        params.push(date);
    }

    sql += " ORDER BY attendance.id DESC";

    console.log("Executing SQL:", sql.substring(0, 100) + "...");

    db.query(sql,params,(err,result)=>{

        if(err){
            console.error("Reports query error:", err);
            return res.status(500).json({
                error: err.message
            });
        }

        console.log(`Found ${result.length} attendance records`);
        res.json(result);

    });

});

module.exports = router;
