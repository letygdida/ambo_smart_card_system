const express = require("express");
const db = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

// ========================================
// DETAILED STUDENT REPORT - COMPREHENSIVE
// ========================================
router.get("/student/:studentId/detailed-txt", verifyToken, (req, res) => {
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
            u.nationality,
            u.region,
            u.zone,
            u.woreda,
            u.address,
            u.department,
            u.year,
            u.semester,
            u.section,
            u.program,
            u.university,
            u.campus,
            u.college,
            u.school,
            u.university_email,
            u.emergency_contact_name,
            u.emergency_contact_relationship,
            u.emergency_contact_phone,
            u.emergency_contact_address,
            u.registration_status,
            u.registered_at,
            u.approved_at,
            u.card_status,
            u.profile_completed,
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

                const textReport = generateDetailedStudentReport(student, attendance, recentAttendance);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="student_detailed_report_${studentId}_${new Date().toISOString().split('T')[0]}.txt"`);
                res.send(textReport);
            });
        });
    });
});

// ========================================
// DETAILED EMPLOYEE REPORT - COMPREHENSIVE
// ========================================
router.get("/employee/:employeeId/detailed-txt", verifyToken, (req, res) => {
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
            e.nationality,
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
            e.card_number,
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

                const textReport = generateDetailedEmployeeReport(employee, attendance, recentAttendance);
                
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="employee_detailed_report_${employeeId}_${new Date().toISOString().split('T')[0]}.txt"`);
                res.send(textReport);
            });
        });
    });
});

// ========================================
// ALL STUDENTS COMPREHENSIVE REPORT
// ========================================
router.get("/students/comprehensive-txt", verifyToken, adminOnly, (req, res) => {
    const sql = `
        SELECT 
            u.student_id,
            u.full_name,
            u.personal_email,
            u.phone_number,
            u.department,
            u.year,
            u.program,
            u.registration_status,
            u.card_status,
            u.profile_completed,
            s.smart_card_id,
            s.status as student_status,
            COUNT(CASE WHEN a.attendance_status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.attendance_status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.attendance_status = 'absent' THEN 1 END) as absent_days,
            COUNT(a.id) as total_attendance_records
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

        const textReport = generateStudentsComprehensiveReport(results);
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="students_comprehensive_report_${new Date().toISOString().split('T')[0]}.txt"`);
        res.send(textReport);
    });
});

// ========================================
// ALL EMPLOYEES COMPREHENSIVE REPORT
// ========================================
router.get("/employees/comprehensive-txt", verifyToken, adminOnly, (req, res) => {
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
            e.date_of_contract_end,
            e.campus,
            d.department_name,
            e.card_status,
            COUNT(CASE WHEN a.attendance_status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.attendance_status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.attendance_status = 'absent' THEN 1 END) as absent_days,
            COUNT(a.id) as total_attendance_records
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

        const textReport = generateEmployeesComprehensiveReport(results);
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="employees_comprehensive_report_${new Date().toISOString().split('T')[0]}.txt"`);
        res.send(textReport);
    });
});

// ========================================
// HELPER FUNCTIONS FOR TEXT GENERATION
// ========================================

function generateDetailedStudentReport(student, attendance, recentAttendance) {
    const attendanceSummary = {};
    let totalAttendance = 0;
    attendance.forEach(item => {
        attendanceSummary[item.attendance_status] = item.count;
        totalAttendance += item.count;
    });

    const now = new Date();
    const reportDate = now.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    let text = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    AMBO UNIVERSITY SMART CARD MANAGEMENT SYSTEM              ║
║                         DETAILED STUDENT PROFILE REPORT                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

Report Generated: ${reportDate}
Report Type: Individual Student Profile
Status: Official Document

═══════════════════════════════════════════════════════════════════════════════

1. PERSONAL IDENTIFICATION INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Student ID:                  ${student.student_id}
    Full Name:                   ${student.full_name}
    Username:                    ${student.username}
    Gender:                      ${student.gender || 'Not Specified'}
    Date of Birth:               ${student.date_of_birth || 'Not Provided'}
    Nationality:                 ${student.nationality || 'Not Provided'}

    Geographic Information:
    ├─ Region:                   ${student.region || 'Not Provided'}
    ├─ Zone:                     ${student.zone || 'Not Provided'}
    ├─ Woreda:                   ${student.woreda || 'Not Provided'}
    └─ Address:                  ${student.address || 'Not Provided'}

═══════════════════════════════════════════════════════════════════════════════

2. CONTACT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Primary Email (Personal):    ${student.personal_email || 'Not Provided'}
    University Email:            ${student.university_email || 'Not Provided'}
    Phone Number:                ${student.phone_number || 'Not Provided'}

═══════════════════════════════════════════════════════════════════════════════

3. EMERGENCY CONTACT DETAILS
─────────────────────────────────────────────────────────────────────────────

    Emergency Contact Name:      ${student.emergency_contact_name || 'Not Provided'}
    Relationship:                ${student.emergency_contact_relationship || 'Not Provided'}
    Emergency Phone:             ${student.emergency_contact_phone || 'Not Provided'}
    Emergency Address:           ${student.emergency_contact_address || 'Not Provided'}

═══════════════════════════════════════════════════════════════════════════════

4. ACADEMIC INFORMATION
─────────────────────────────────────────────────────────────────────────────

    University:                  ${student.university || 'Not Specified'}
    Campus:                      ${student.campus || 'Not Specified'}
    College:                     ${student.college || 'Not Specified'}
    School:                      ${student.school || 'Not Specified'}
    Department:                  ${student.department || 'Not Specified'}
    Program:                     ${student.program || 'Not Specified'}
    Academic Year:               ${student.year || 'N/A'}
    Semester:                    ${student.semester || 'N/A'}
    Section:                     ${student.section || 'N/A'}
    Profile Completion Status:   ${student.profile_completed ? 'COMPLETED' : 'INCOMPLETE'}

═══════════════════════════════════════════════════════════════════════════════

5. REGISTRATION AND APPROVAL STATUS
─────────────────────────────────────────────────────────────────────────────

    Registration Status:         ${(student.registration_status || 'PENDING').toUpperCase()}
    Registration Date:           ${student.registered_at ? new Date(student.registered_at).toLocaleDateString() : 'N/A'}
    Approval Date:               ${student.approved_at ? new Date(student.approved_at).toLocaleDateString() : 'Pending Approval'}

═══════════════════════════════════════════════════════════════════════════════

6. SMART CARD AND IDENTIFICATION
─────────────────────────────────────────────────────────────────────────────

    Card Status:                 ${(student.card_status || 'INACTIVE').toUpperCase()}
    Smart Card ID:               ${student.smart_card_id || 'Not Yet Issued'}
    Student System Status:       ${(student.student_status || 'ACTIVE').toUpperCase()}

═══════════════════════════════════════════════════════════════════════════════

7. ATTENDANCE SUMMARY
─────────────────────────────────────────────────────────────────────────────

    Total Attendance Records:    ${totalAttendance}
    
    Attendance Breakdown:
    ├─ Present:                  ${attendanceSummary.present || 0} days
    ├─ Late:                     ${attendanceSummary.late || 0} days
    ├─ Absent:                   ${attendanceSummary.absent || 0} days
    └─ Excused:                  ${attendanceSummary.excused || 0} days
    
    Attendance Rate:             ${totalAttendance > 0 ? ((attendanceSummary.present || 0) / totalAttendance * 100).toFixed(2) : 0}%

═══════════════════════════════════════════════════════════════════════════════

8. RECENT ATTENDANCE RECORDS (Last 30 Days)
─────────────────────────────────────────────────────────────────────────────
`;

if (recentAttendance.length === 0) {
    text += `
    No recent attendance records found.
`;
} else {
    recentAttendance.forEach((record, index) => {
        text += `
    Record ${index + 1}:
    ├─ Date:                     ${record.attendance_date}
    ├─ Check-in Time:            ${record.check_in_time || 'N/A'}
    ├─ Check-out Time:           ${record.check_out_time || 'N/A'}
    ├─ Status:                   ${record.attendance_status.toUpperCase()}
    └─ Department:               ${record.department_name || 'N/A'}
`;
    });
}

text += `

═══════════════════════════════════════════════════════════════════════════════

9. DOCUMENT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Report Generated By:         Automated System
    Generated On:                ${reportDate}
    System:                      Ambo University Smart Card Management System
    Version:                     1.0

    This is an official system-generated report. Digital records are maintained
    in the university database and are subject to data protection policies.

═══════════════════════════════════════════════════════════════════════════════

END OF REPORT

═══════════════════════════════════════════════════════════════════════════════
    © Ambo University 2026 | All Rights Reserved | Confidential
═══════════════════════════════════════════════════════════════════════════════
`;

    return text;
}

function generateDetailedEmployeeReport(employee, attendance, recentAttendance) {
    const attendanceSummary = {};
    let totalAttendance = 0;
    attendance.forEach(item => {
        attendanceSummary[item.attendance_status] = item.count;
        totalAttendance += item.count;
    });

    const fullName = `${employee.first_name} ${employee.middle_name || ''} ${employee.last_name}`.trim();
    const now = new Date();
    const reportDate = now.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    let text = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    AMBO UNIVERSITY SMART CARD MANAGEMENT SYSTEM              ║
║                       DETAILED EMPLOYEE PROFILE REPORT                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Report Generated: ${reportDate}
Report Type: Individual Employee Profile
Status: Official Document

═══════════════════════════════════════════════════════════════════════════════

1. PERSONAL IDENTIFICATION INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Employee ID:                 ${employee.employee_id}
    Full Name:                   ${fullName}
    Gender:                      ${employee.gender || 'Not Specified'}
    Date of Birth:               ${employee.date_of_birth || 'Not Provided'}
    Nationality:                 ${employee.nationality || 'Not Provided'}

═══════════════════════════════════════════════════════════════════════════════

2. CONTACT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Email Address:               ${employee.email || 'Not Provided'}
    Phone Number:                ${employee.phone || 'Not Provided'}

═══════════════════════════════════════════════════════════════════════════════

3. EMPLOYMENT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Department:                  ${employee.department_name || 'Not Assigned'}
    Position:                    ${employee.position || 'Not Specified'}
    Employee Type:               ${employee.employee_type || 'Not Classified'}
    Staff Category:              ${employee.staff_category || 'Not Classified'}
    Employment Status:           ${(employee.employment_status || 'ACTIVE').toUpperCase()}

═══════════════════════════════════════════════════════════════════════════════

4. APPOINTMENT AND CONTRACT DETAILS
─────────────────────────────────────────────────────────────────────────────

    Date of Appointment:         ${employee.date_of_appointment || 'Not Provided'}
    Contract End Date:           ${employee.date_of_contract_end || 'Permanent'}
    Years of Service:            ${employee.date_of_appointment ? calculateYearsOfService(employee.date_of_appointment) : 'N/A'}

═══════════════════════════════════════════════════════════════════════════════

5. WORK LOCATION AND ASSIGNMENT
─────────────────────────────────────────────────────────────────────────────

    Campus:                      ${employee.campus || 'Not Specified'}
    Office Location:             ${employee.office_location || 'Not Assigned'}

═══════════════════════════════════════════════════════════════════════════════

6. SMART CARD AND IDENTIFICATION
─────────────────────────────────────────────────────────────────────────────

    Card Status:                 ${(employee.card_status || 'INACTIVE').toUpperCase()}
    Card Number:                 ${employee.card_number || 'Not Yet Issued'}

═══════════════════════════════════════════════════════════════════════════════

7. ATTENDANCE SUMMARY
─────────────────────────────────────────────────────────────────────────────

    Total Attendance Records:    ${totalAttendance}
    
    Attendance Breakdown:
    ├─ Present:                  ${attendanceSummary.present || 0} days
    ├─ Late:                     ${attendanceSummary.late || 0} days
    ├─ Absent:                   ${attendanceSummary.absent || 0} days
    └─ Excused:                  ${attendanceSummary.excused || 0} days
    
    Attendance Rate:             ${totalAttendance > 0 ? ((attendanceSummary.present || 0) / totalAttendance * 100).toFixed(2) : 0}%
    Punctuality Rate:            ${totalAttendance > 0 ? (((attendanceSummary.present || 0) / totalAttendance) * 100).toFixed(2) : 0}%

═══════════════════════════════════════════════════════════════════════════════

8. RECENT ATTENDANCE RECORDS (Last 30 Days)
─────────────────────────────────────────────────────────────────────────────
`;

if (recentAttendance.length === 0) {
    text += `
    No recent attendance records found.
`;
} else {
    recentAttendance.forEach((record, index) => {
        text += `
    Record ${index + 1}:
    ├─ Date:                     ${record.attendance_date}
    ├─ Check-in Time:            ${record.check_in_time || 'N/A'}
    ├─ Check-out Time:           ${record.check_out_time || 'N/A'}
    ├─ Status:                   ${record.attendance_status.toUpperCase()}
    └─ Department:               ${record.department_name || 'N/A'}
`;
    });
}

text += `

═══════════════════════════════════════════════════════════════════════════════

9. RECORD HISTORY
─────────────────────────────────────────────────────────────────────────────

    Record Created On:           ${employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}

═══════════════════════════════════════════════════════════════════════════════

10. DOCUMENT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Report Generated By:         Automated System
    Generated On:                ${reportDate}
    System:                      Ambo University Smart Card Management System
    Version:                     1.0

    This is an official system-generated report. Digital records are maintained
    in the university database and are subject to data protection policies.

═══════════════════════════════════════════════════════════════════════════════

END OF REPORT

═══════════════════════════════════════════════════════════════════════════════
    © Ambo University 2026 | All Rights Reserved | Confidential
═══════════════════════════════════════════════════════════════════════════════
`;

    return text;
}

function generateStudentsComprehensiveReport(students) {
    const now = new Date();
    const reportDate = now.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Calculate statistics
    const totalStudents = students.length;
    const approvedCount = students.filter(s => s.registration_status === 'approved').length;
    const pendingCount = students.filter(s => s.registration_status === 'pending').length;
    const rejectedCount = students.filter(s => s.registration_status === 'rejected').length;
    const activeCardsCount = students.filter(s => s.card_status === 'active').length;
    const profilesCompleted = students.filter(s => s.profile_completed).length;

    let text = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    AMBO UNIVERSITY SMART CARD MANAGEMENT SYSTEM              ║
║                     COMPREHENSIVE STUDENTS LIST REPORT                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Report Generated: ${reportDate}
Report Type: Students Comprehensive List
Status: Official Document

═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────────────

    Total Students in System:    ${totalStudents}
    
    Registration Status:
    ├─ Approved:                 ${approvedCount} (${((approvedCount/totalStudents)*100).toFixed(2)}%)
    ├─ Pending:                  ${pendingCount} (${((pendingCount/totalStudents)*100).toFixed(2)}%)
    └─ Rejected:                 ${rejectedCount} (${((rejectedCount/totalStudents)*100).toFixed(2)}%)
    
    Smart Cards Issued:          ${activeCardsCount}
    Profiles Completed:          ${profilesCompleted} (${((profilesCompleted/totalStudents)*100).toFixed(2)}%)

═══════════════════════════════════════════════════════════════════════════════

DETAILED STUDENT RECORDS
─────────────────────────────────────────────────────────────────────────────

`;

    text += `${'#'.padEnd(4)} | ${'Student ID'.padEnd(15)} | ${'Full Name'.padEnd(30)} | ${'Department'.padEnd(20)} | ${'Year'.padEnd(5)} | ${'Status'.padEnd(12)} | ${'Attendance'.padEnd(20)}\n`;
    text += `${'-'.repeat(180)}\n`;

    students.forEach((student, index) => {
        const attendance = `P:${student.present_days || 0} L:${student.late_days || 0} A:${student.absent_days || 0}`;
        text += `${(index + 1).toString().padEnd(4)} | ${(student.student_id || 'N/A').padEnd(15)} | ${(student.full_name || 'N/A').substring(0, 29).padEnd(30)} | ${(student.department || 'N/A').substring(0, 19).padEnd(20)} | ${(student.year || 'N/A').toString().padEnd(5)} | ${(student.registration_status || 'N/A').toUpperCase().substring(0, 11).padEnd(12)} | ${attendance.padEnd(20)}\n`;
    });

    text += `

═══════════════════════════════════════════════════════════════════════════════

DOCUMENT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Report Generated By:         Automated System
    Generated On:                ${reportDate}
    System:                      Ambo University Smart Card Management System
    Version:                     1.0

═══════════════════════════════════════════════════════════════════════════════

END OF REPORT

═══════════════════════════════════════════════════════════════════════════════
    © Ambo University 2026 | All Rights Reserved | Confidential
═══════════════════════════════════════════════════════════════════════════════
`;

    return text;
}

function generateEmployeesComprehensiveReport(employees) {
    const now = new Date();
    const reportDate = now.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Calculate statistics
    const totalEmployees = employees.length;
    const activeCount = employees.filter(e => e.employment_status === 'active').length;
    const inactiveCount = employees.filter(e => e.employment_status === 'inactive').length;
    const onLeaveCount = employees.filter(e => e.employment_status === 'on_leave').length;
    const activeCardsCount = employees.filter(e => e.card_status === 'active').length;

    let text = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    AMBO UNIVERSITY SMART CARD MANAGEMENT SYSTEM              ║
║                    COMPREHENSIVE EMPLOYEES LIST REPORT                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Report Generated: ${reportDate}
Report Type: Employees Comprehensive List
Status: Official Document

═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────────────

    Total Employees in System:   ${totalEmployees}
    
    Employment Status:
    ├─ Active:                   ${activeCount} (${((activeCount/totalEmployees)*100).toFixed(2)}%)
    ├─ Inactive:                 ${inactiveCount} (${((inactiveCount/totalEmployees)*100).toFixed(2)}%)
    └─ On Leave:                 ${onLeaveCount} (${((onLeaveCount/totalEmployees)*100).toFixed(2)}%)
    
    Smart Cards Issued:          ${activeCardsCount}

═══════════════════════════════════════════════════════════════════════════════

DETAILED EMPLOYEE RECORDS
─────────────────────────────────────────────────────────────────────────────

`;

    text += `${'#'.padEnd(4)} | ${'Employee ID'.padEnd(15)} | ${'Full Name'.padEnd(30)} | ${'Department'.padEnd(20)} | ${'Position'.padEnd(20)} | ${'Status'.padEnd(12)} | ${'Attendance'.padEnd(20)}\n`;
    text += `${'-'.repeat(200)}\n`;

    employees.forEach((employee, index) => {
        const attendance = `P:${employee.present_days || 0} L:${employee.late_days || 0} A:${employee.absent_days || 0}`;
        text += `${(index + 1).toString().padEnd(4)} | ${(employee.employee_id || 'N/A').padEnd(15)} | ${(employee.full_name || 'N/A').substring(0, 29).padEnd(30)} | ${(employee.department_name || 'N/A').substring(0, 19).padEnd(20)} | ${(employee.position || 'N/A').substring(0, 19).padEnd(20)} | ${(employee.employment_status || 'N/A').toUpperCase().substring(0, 11).padEnd(12)} | ${attendance.padEnd(20)}\n`;
    });

    text += `

═══════════════════════════════════════════════════════════════════════════════

DOCUMENT INFORMATION
─────────────────────────────────────────────────────────────────────────────

    Report Generated By:         Automated System
    Generated On:                ${reportDate}
    System:                      Ambo University Smart Card Management System
    Version:                     1.0

═══════════════════════════════════════════════════════════════════════════════

END OF REPORT

═══════════════════════════════════════════════════════════════════════════════
    © Ambo University 2026 | All Rights Reserved | Confidential
═══════════════════════════════════════════════════════════════════════════════
`;

    return text;
}

function calculateYearsOfService(appointmentDate) {
    const start = new Date(appointmentDate);
    const now = new Date();
    return Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
}

module.exports = router;
