const express = require("express");
const db = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

// ===== EXPORT STUDENT REPORT AS TEXT =====
router.get("/student/:studentId/export-txt", verifyToken, (req, res) => {
    const { studentId } = req.params;

    const sql = `
        SELECT 
            u.id,
            u.student_id,
            u.username,
            u.full_name,
            u.personal_email,
            u.phone_number,
            u.gender,
            u.date_of_birth,
            u.department,
            u.year,
            u.university,
            u.campus,
            u.college,
            u.program,
            u.university_email,
            u.emergency_contact_name,
            u.emergency_contact_relationship,
            u.emergency_contact_phone,
            u.registration_status,
            u.registered_at,
            u.approved_at,
            u.card_status,
            s.smart_card_id,
            s.status as student_status
        FROM users u
        LEFT JOIN students s ON u.student_id = s.student_id
        WHERE u.student_id = ? AND u.role = 'student'
    `;

    db.query(sql, [studentId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const student = results[0];

        const attendanceSql = `
            SELECT 
                attendance_status,
                COUNT(*) as count
            FROM attendance
            WHERE student_id = ? AND person_type = 'student'
            GROUP BY attendance_status
        `;

        db.query(attendanceSql, [studentId], (err, attendance) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const recentSql = `
                SELECT 
                    attendance_date,
                    check_in_time,
                    check_out_time,
                    attendance_status,
                    department_name
                FROM attendance
                WHERE student_id = ? AND person_type = 'student'
                ORDER BY attendance_date DESC
                LIMIT 30
            `;

            db.query(recentSql, [studentId], (err, recentAttendance) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const textReport = generateStudentTextReport(student, attendance, recentAttendance);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="student_report_${studentId}_${new Date().toISOString().split('T')[0]}.txt"`);
                res.send(textReport);
            });
        });
    });
});

// ===== EXPORT EMPLOYEE REPORT AS TEXT =====
router.get("/employee/:employeeId/export-txt", verifyToken, (req, res) => {
    const { employeeId } = req.params;

    const sql = `
        SELECT 
            e.id,
            e.employee_id,
            e.first_name,
            e.middle_name,
            e.last_name,
            e.gender,
            e.date_of_birth,
            e.phone,
            e.email,
            e.employee_type,
            e.position,
            e.staff_category,
            e.employment_status,
            e.date_of_appointment,
            e.date_of_contract_end,
            e.campus,
            e.office_location,
            e.card_status,
            d.department_name,
            e.created_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.employee_id = ?
    `;

    db.query(sql, [employeeId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const employee = results[0];

        const attendanceSql = `
            SELECT 
                attendance_status,
                COUNT(*) as count
            FROM attendance
            WHERE student_id = ? AND person_type = 'employee'
            GROUP BY attendance_status
        `;

        db.query(attendanceSql, [employeeId], (err, attendance) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const recentSql = `
                SELECT 
                    attendance_date,
                    check_in_time,
                    check_out_time,
                    attendance_status,
                    department_name
                FROM attendance
                WHERE student_id = ? AND person_type = 'employee'
                ORDER BY attendance_date DESC
                LIMIT 30
            `;

            db.query(recentSql, [employeeId], (err, recentAttendance) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const textReport = generateEmployeeTextReport(employee, attendance, recentAttendance);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="employee_report_${employeeId}_${new Date().toISOString().split('T')[0]}.txt"`);
                res.send(textReport);
            });
        });
    });
});

// ===== EXPORT STUDENTS LIST AS TEXT =====
router.get("/students/list/export-txt", verifyToken, adminOnly, (req, res) => {
    const sql = `
        SELECT 
            u.student_id,
            u.full_name,
            u.personal_email,
            u.phone_number,
            u.department,
            u.year,
            u.registration_status,
            u.card_status,
            s.smart_card_id,
            COUNT(CASE WHEN a.attendance_status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.attendance_status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.attendance_status = 'absent' THEN 1 END) as absent_days
        FROM users u
        LEFT JOIN students s ON u.student_id = s.student_id
        LEFT JOIN attendance a ON u.student_id = a.student_id AND a.person_type = 'student'
        WHERE u.role = 'student'
        GROUP BY u.student_id
        ORDER BY u.full_name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const textReport = generateStudentsListTextReport(results);
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="students_list_report_${new Date().toISOString().split('T')[0]}.txt"`);
        res.send(textReport);
    });
});

// ===== EXPORT EMPLOYEES LIST AS TEXT =====
router.get("/employees/list/export-txt", verifyToken, adminOnly, (req, res) => {
    const sql = `
        SELECT 
            e.employee_id,
            CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.last_name) as full_name,
            e.gender,
            e.phone,
            e.email,
            e.employee_type,
            e.position,
            e.staff_category,
            e.employment_status,
            e.date_of_appointment,
            d.department_name,
            COUNT(CASE WHEN a.attendance_status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.attendance_status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.attendance_status = 'absent' THEN 1 END) as absent_days
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN attendance a ON e.employee_id = a.student_id AND a.person_type = 'employee'
        GROUP BY e.employee_id
        ORDER BY e.first_name, e.last_name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const textReport = generateEmployeesListTextReport(results);
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="employees_list_report_${new Date().toISOString().split('T')[0]}.txt"`);
        res.send(textReport);
    });
});

// ===== TEXT REPORT GENERATION FUNCTIONS =====

function generateStudentTextReport(student, attendance, recentAttendance) {
    const attendanceSummary = {};
    attendance.forEach(item => {
        attendanceSummary[item.attendance_status] = item.count;
    });

    const now = new Date().toLocaleString();
    let text = `
===============================================
        STUDENT PROFILE REPORT
===============================================
Generated: ${now}

PERSONAL INFORMATION
-------------------
Student ID:          ${student.student_id}
Full Name:           ${student.full_name}
Username:            ${student.username}
Gender:              ${student.gender || 'N/A'}
Date of Birth:       ${student.date_of_birth || 'N/A'}

CONTACT INFORMATION
-------------------
Personal Email:      ${student.personal_email || 'N/A'}
University Email:    ${student.university_email || 'N/A'}
Phone Number:        ${student.phone_number || 'N/A'}

EMERGENCY CONTACT
-----------------
Name:                ${student.emergency_contact_name || 'N/A'}
Relationship:        ${student.emergency_contact_relationship || 'N/A'}
Phone:               ${student.emergency_contact_phone || 'N/A'}

ACADEMIC INFORMATION
--------------------
University:          ${student.university || 'N/A'}
Campus:              ${student.campus || 'N/A'}
College:             ${student.college || 'N/A'}
Department:          ${student.department || 'N/A'}
Program:             ${student.program || 'N/A'}
Year:                ${student.year || 'N/A'}

REGISTRATION DETAILS
--------------------
Registration Status: ${student.registration_status || 'N/A'}
Registered Date:     ${student.registered_at ? new Date(student.registered_at).toLocaleDateString() : 'N/A'}
Approved Date:       ${student.approved_at ? new Date(student.approved_at).toLocaleDateString() : 'N/A'}

CARD INFORMATION
----------------
Card Status:         ${student.card_status || 'N/A'}
Smart Card ID:       ${student.smart_card_id || 'N/A'}

ATTENDANCE SUMMARY
------------------
Total Present:       ${attendanceSummary.present || 0} days
Total Late:          ${attendanceSummary.late || 0} days
Total Absent:        ${attendanceSummary.absent || 0} days
Total Excused:       ${attendanceSummary.excused || 0} days

RECENT ATTENDANCE RECORDS (Last 30 Days)
----------------------------------------
`;

    recentAttendance.forEach((record, index) => {
        text += `
[${index + 1}]
Date:       ${record.attendance_date}
Check In:   ${record.check_in_time || 'N/A'}
Check Out:  ${record.check_out_time || 'N/A'}
Status:     ${record.attendance_status.toUpperCase()}
Department: ${record.department_name || 'N/A'}`;
    });

    text += `

===============================================
End of Report
===============================================
`;
    return text;
}

function generateEmployeeTextReport(employee, attendance, recentAttendance) {
    const attendanceSummary = {};
    attendance.forEach(item => {
        attendanceSummary[item.attendance_status] = item.count;
    });

    const fullName = `${employee.first_name} ${employee.middle_name || ''} ${employee.last_name}`.trim();
    const now = new Date().toLocaleString();

    let text = `
===============================================
        EMPLOYEE PROFILE REPORT
===============================================
Generated: ${now}

PERSONAL INFORMATION
-------------------
Employee ID:         ${employee.employee_id}
Full Name:           ${fullName}
Gender:              ${employee.gender || 'N/A'}
Date of Birth:       ${employee.date_of_birth || 'N/A'}

CONTACT INFORMATION
-------------------
Email:               ${employee.email || 'N/A'}
Phone:               ${employee.phone || 'N/A'}

EMPLOYMENT DETAILS
------------------
Department:          ${employee.department_name || 'N/A'}
Position:            ${employee.position || 'N/A'}
Employee Type:       ${employee.employee_type || 'N/A'}
Staff Category:      ${employee.staff_category || 'N/A'}
Employment Status:   ${employee.employment_status || 'N/A'}

APPOINTMENT INFORMATION
-----------------------
Date of Appointment: ${employee.date_of_appointment || 'N/A'}
Contract End Date:   ${employee.date_of_contract_end || 'N/A'}

WORK LOCATION
-------------
Campus:              ${employee.campus || 'N/A'}
Office Location:     ${employee.office_location || 'N/A'}

CARD INFORMATION
----------------
Card Status:         ${employee.card_status || 'N/A'}

ATTENDANCE SUMMARY
------------------
Total Present:       ${attendanceSummary.present || 0} days
Total Late:          ${attendanceSummary.late || 0} days
Total Absent:        ${attendanceSummary.absent || 0} days
Total Excused:       ${attendanceSummary.excused || 0} days

RECENT ATTENDANCE RECORDS (Last 30 Days)
----------------------------------------
`;

    recentAttendance.forEach((record, index) => {
        text += `
[${index + 1}]
Date:       ${record.attendance_date}
Check In:   ${record.check_in_time || 'N/A'}
Check Out:  ${record.check_out_time || 'N/A'}
Status:     ${record.attendance_status.toUpperCase()}
Department: ${record.department_name || 'N/A'}`;
    });

    text += `

===============================================
End of Report
===============================================
`;
    return text;
}

function generateStudentsListTextReport(students) {
    const now = new Date().toLocaleString();
    let text = `
===============================================
        STUDENTS LIST REPORT
===============================================
Generated: ${now}
Total Students: ${students.length}

`;

    text += `${'Student ID'.padEnd(15)} | ${'Full Name'.padEnd(30)} | ${'Department'.padEnd(20)} | ${'Year'.padEnd(4)} | ${'Status'.padEnd(15)} | ${'Attendance'.padEnd(30)}\n`;
    text += `${'-'.repeat(160)}\n`;

    students.forEach(student => {
        const attendance = `P:${student.present_days || 0} L:${student.late_days || 0} A:${student.absent_days || 0}`;
        text += `${(student.student_id || 'N/A').padEnd(15)} | ${(student.full_name || 'N/A').padEnd(30)} | ${(student.department || 'N/A').padEnd(20)} | ${(student.year || 'N/A').toString().padEnd(4)} | ${(student.registration_status || 'N/A').padEnd(15)} | ${attendance.padEnd(30)}\n`;
    });

    text += `
===============================================
End of Report
===============================================
`;
    return text;
}

function generateEmployeesListTextReport(employees) {
    const now = new Date().toLocaleString();
    let text = `
===============================================
        EMPLOYEES LIST REPORT
===============================================
Generated: ${now}
Total Employees: ${employees.length}

`;

    text += `${'Employee ID'.padEnd(15)} | ${'Full Name'.padEnd(30)} | ${'Department'.padEnd(20)} | ${'Position'.padEnd(20)} | ${'Status'.padEnd(15)} | ${'Attendance'.padEnd(30)}\n`;
    text += `${'-'.repeat(160)}\n`;

    employees.forEach(employee => {
        const attendance = `P:${employee.present_days || 0} L:${employee.late_days || 0} A:${employee.absent_days || 0}`;
        text += `${(employee.employee_id || 'N/A').padEnd(15)} | ${(employee.full_name || 'N/A').padEnd(30)} | ${(employee.department_name || 'N/A').padEnd(20)} | ${(employee.position || 'N/A').padEnd(20)} | ${(employee.employment_status || 'N/A').padEnd(15)} | ${attendance.padEnd(30)}\n`;
    });

    text += `
===============================================
End of Report
===============================================
`;
    return text;
}

module.exports = router;
