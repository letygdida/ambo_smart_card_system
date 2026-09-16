const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// =====================================================
// DEBUG ENDPOINTS (for troubleshooting)
// =====================================================

// DEBUG: Check attendance for a specific student on a specific date
router.get('/debug/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const { date } = req.query;
  const checkDate = date || new Date().toISOString().split('T')[0];

  console.log(`DEBUG: Checking attendance for student ${studentId} on ${checkDate}`);

  // Check attendance table
  db.query(
    'SELECT * FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date = ?',
    ['student', studentId, checkDate],
    (err, results) => {
      if (err) {
        console.error('Debug query error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      // Also check if student exists
      db.query(
        'SELECT student_id, full_name, name FROM users WHERE student_id = ?',
        [studentId],
        (userErr, userResults) => {
          if (userErr) {
            console.error('User query error:', userErr);
            return res.status(500).json({ error: 'User query error' });
          }

          res.json({
            debug_info: {
              student_id: studentId,
              check_date: checkDate,
              student_exists: userResults.length > 0,
              student_data: userResults[0] || null,
              attendance_records_today: results.length,
              attendance_records: results,
              current_time: new Date().toISOString()
            }
          });
        }
      );
    }
  );
});

// DEBUG: Remove duplicate or incorrect attendance records for a student
router.delete('/debug/student/:studentId/clear-today', verifyToken, (req, res) => {
  const { studentId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  console.log(`DEBUG: Clearing attendance for student ${studentId} on ${today}`);

  // First show what will be deleted
  db.query(
    'SELECT * FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date = ?',
    ['student', studentId, today],
    (err, results) => {
      if (err) {
        console.error('Debug query error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.json({
          message: 'No attendance records found for today',
          deleted_count: 0,
          records: []
        });
      }

      // Delete the records
      db.query(
        'DELETE FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date = ?',
        ['student', studentId, today],
        (delErr, deleteResult) => {
          if (delErr) {
            console.error('Delete error:', delErr);
            return res.status(500).json({ error: 'Failed to delete records' });
          }

          res.json({
            message: `Cleared ${deleteResult.affectedRows} attendance record(s) for ${studentId} on ${today}`,
            deleted_count: deleteResult.affectedRows,
            records_that_were_deleted: results
          });
        }
      );
    }
  );
});

// =====================================================
// ATTENDANCE MANAGEMENT ENDPOINTS
// =====================================================

// LEGACY ENDPOINT: Mark attendance (for frontend compatibility)
// This is a simpler endpoint that uses student_id and returns student data
// NOTE: No authentication required for marking attendance (QR scanning use case)
// ALSO: Auto-inserts into cafeteria_attendance if current time is within meal hours
router.post('/mark', (req, res) => {
  const { student_id } = req.body;

  console.log(`[${new Date().toISOString()}] Attendance mark request for student: ${student_id}`);

  if (!student_id) {
    return res.status(400).json({ message: 'Please enter or scan Student ID' });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];

  console.log(`Checking attendance for ${student_id} on ${today}`);

  // Check if student exists in users table
  db.query(
    'SELECT * FROM users WHERE student_id = ?',
    [student_id],
    (err, results) => {
      if (err) {
        console.error('Student query error:', err);
        return res.status(500).json({ message: 'Server connection error', error: err.message });
      }

      console.log(`Student lookup results for ${student_id}:`, results ? results.length : 0, 'records found');

      if (!results || results.length === 0) {
        return res.status(404).json({ 
          message: `Student with ID ${student_id} not found`,
          student: null 
        });
      }

      const student = results[0];
      console.log(`Found student: ${student.full_name || student.name} (${student.student_id})`);

      // Check for duplicate attendance today in main attendance table
      db.query(
        'SELECT * FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date = ?',
        ['student', student_id, today],
        (dupErr, dupResults) => {
          if (dupErr) {
            console.error('Duplicate check error:', dupErr);
            return res.status(500).json({ message: 'Server connection error', error: dupErr.message });
          }

          // Log the duplicate check results for debugging
          console.log(`Duplicate check for student ${student_id} on ${today}:`, {
            resultsFound: dupResults ? dupResults.length : 0,
            results: dupResults
          });

          if (dupResults && dupResults.length > 0) {
            console.log(`Duplicate attendance found for ${student_id}:`, dupResults[0]);
            return res.status(400).json({
              message: 'Attendance already marked for today',
              student: student,
              existing_record: {
                attendance_id: dupResults[0].attendance_id,
                check_in_time: dupResults[0].check_in_time,
                status: dupResults[0].attendance_status
              }
            });
          }

          console.log(`No duplicate found. Recording new attendance for ${student_id}`);

          // Record attendance in main attendance table
          const attendanceId = `ATT-${Date.now()}`;

          const insertQuery = `
            INSERT INTO attendance (
              attendance_id, person_type, student_id, person_name, department_id, 
              department_name, attendance_date, check_in_time, attendance_status, 
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          console.log(`Inserting attendance record: ${attendanceId}`);

          db.query(insertQuery, [
            attendanceId, 'student', student_id, student.full_name || student.name, 
            student.department_id || null, student.department || null,
            today, now, 'present'
          ], (insertErr) => {
            if (insertErr) {
              console.error('Insert error:', insertErr);
              return res.status(500).json({ message: 'Server connection error', error: insertErr.message });
            }

            console.log(`Successfully recorded attendance: ${attendanceId} for ${student_id}`);

            // AUTO-INSERT into cafeteria_attendance (NEW FEATURE)
            // Check if current time is within any meal window
            const cafeteriaInsertPromise = new Promise((resolve) => {
              db.query(
                'SELECT meal_type FROM meal_times_config WHERE is_active = 1 AND ? BETWEEN start_time AND end_time LIMIT 1',
                [now],
                (mealErr, mealResults) => {
                  if (mealErr || !mealResults || mealResults.length === 0) {
                    return resolve(); // No meal window, skip cafeteria insert
                  }
                  
                  const mealType = mealResults[0].meal_type;
                  
                  // Check if already attended this meal today
                  db.query(
                    'SELECT id FROM cafeteria_attendance WHERE student_id = ? AND meal_type = ? AND attendance_date = ?',
                    [student_id, mealType, today],
                    (cafCheckErr, cafCheckResults) => {
                      if (cafCheckErr || (cafCheckResults && cafCheckResults.length > 0)) {
                        return resolve(); // Error or already attended, skip insert
                      }
                      
                      // Insert into cafeteria_attendance
                      const cafeteriaId = `CAF-${Date.now()}`;
                      
                      db.query(
                        `INSERT INTO cafeteria_attendance (
                          attendance_id, student_id, student_name, department_id, department_name, 
                          meal_type, attendance_date, scan_time, attendance_status, verification_method
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                          cafeteriaId, student_id, student.full_name || student.name,
                          student.department_id || null, student.department || null,
                          mealType, today, now, 'attended', 'auto_insert'
                        ],
                        (cafInsertErr) => {
                          resolve(); // Always resolve, whether success or error
                        }
                      );
                    }
                  );
                }
              );
            });
            
            // Execute cafeteria insert in background (don't wait for it)
            cafeteriaInsertPromise.catch(() => {}); // Ignore errors

            // Return success response immediately
            res.status(201).json({
              message: 'Attendance marked successfully',
              student: {
                full_name: student.full_name || student.name,
                student_id: student.student_id,
                department: student.department,
                year: student.year,
                photo: student.photo
              },
              attendance_record: {
                attendance_id: attendanceId,
                check_in_time: now,
                date: today
              }
            });
          });
        }
      );
    }
  );
});

// MARK EMPLOYEE ATTENDANCE ENDPOINT WITH TIME CONTROL
// This endpoint accepts employee_id and attendance_type, validates time control,
// and records attendance automatically categorized by staff type
router.post('/mark-employee', (req, res) => {
  const { employee_id, attendance_type = 'check-in' } = req.body;

  console.log(`[${new Date().toISOString()}] Employee attendance request:`, {
    employee_id,
    attendance_type
  });

  if (!employee_id) {
    return res.status(400).json({ message: 'Please enter or scan Employee ID' });
  }

  // Validate attendance_type
  const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
  if (!validTypes.includes(attendance_type)) {
    return res.status(400).json({ 
      message: 'Invalid attendance type',
      valid_types: validTypes
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];

  // STEP 1: Check if attendance control allows marking attendance (SIMPLIFIED - NO STORED PROCEDURE)
  db.query(
    "SELECT id, control_mode, is_open FROM employee_attendance_control WHERE attendance_type = ? AND is_active = TRUE LIMIT 1",
    [attendance_type],
    (controlErr, controlResults) => {
      if (controlErr) {
        console.error('Control check error:', controlErr);
        return res.status(500).json({ 
          message: 'Unable to verify attendance control status',
          error: controlErr.message 
        });
      }

      let isOpen = true; // Default to open if no control found
      let controlMode = 'manual';
      let controlId = null;

      if (controlResults && controlResults.length > 0) {
        isOpen = controlResults[0].is_open === 1;
        controlMode = controlResults[0].control_mode;
        controlId = controlResults[0].id;
      }

      console.log(`Attendance control status:`, {
        attendance_type,
        is_open: isOpen,
        control_mode: controlMode
      });

      // VALIDATION: Reject if attendance is closed
      if (!isOpen) {
        return res.status(403).json({
          success: false,
          message: `Employee ${attendance_type} attendance is currently CLOSED`,
          details: 'Attendance control is closed. Please contact administrator.',
          control_mode: controlMode,
          attendance_type: attendance_type,
          current_time: now,
          rejection_reason: 'attendance_closed'
        });
      }

      // STEP 2: Attendance is OPEN - proceed with marking
      console.log(`✅ Attendance control is OPEN. Proceeding with ${attendance_type}`);

        // Check if employee exists in employees table
        db.query(
          `SELECT e.*, d.department_name 
           FROM employees e 
           LEFT JOIN departments d ON e.department_id = d.id 
           WHERE e.employee_id = ?`,
          [employee_id],
          (err, results) => {
            if (err) {
              console.error('Employee query error:', err);
              return res.status(500).json({ message: 'Server connection error', error: err.message });
            }

            if (!results || results.length === 0) {
              return res.status(404).json({ 
                message: `Employee with ID ${employee_id} not found`,
                employee: null 
              });
            }

            const employee = results[0];
            const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();

            // Check for duplicate attendance today
            db.query(
              'SELECT id, control_id FROM employee_attendance_records WHERE employee_id = ? AND attendance_type = ? AND scan_date = ?',
              [employee_id, attendance_type, today],
              (dupErr, dupResults) => {
                if (dupErr) {
                  console.error('Duplicate check error:', dupErr);
                  return res.status(500).json({ message: 'Server connection error', error: dupErr.message });
                }

                if (dupResults && dupResults.length > 0) {
                  return res.status(400).json({
                    success: false,
                    message: `${attendance_type} attendance already marked for today`,
                    employee: {
                      employee_id: employee.employee_id,
                      first_name: employee.first_name,
                      last_name: employee.last_name,
                      full_name: fullName,
                      employee_type: employee.employee_type
                    },
                    existing_record: {
                      scan_time: dupResults[0].scan_time,
                      scan_date: dupResults[0].scan_date
                    }
                  });
                }

                // Log employee data for debugging
                console.log(`📋 Employee data for ${employee_id}:`, {
                  employee_type: employee.employee_type,
                  department: employee.department_name,
                  campus: employee.campus,
                  position: employee.position
                });

                // Record attendance in new table
                const insertQuery = `
                  INSERT INTO employee_attendance_records (
                    employee_id, employee_name, employee_type, department, campus, position,
                    attendance_type, scan_timestamp, scan_date, scan_time,
                    control_id, control_mode, status, is_valid
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, 'present', TRUE)
                `;

                db.query(insertQuery, [
                  employee_id, 
                  fullName, 
                  employee.employee_type || 'Unassigned',
                  employee.department_name || null, 
                  employee.campus || null,
                  employee.position || null,
                  attendance_type, 
                  today, 
                  now, 
                  controlId, 
                  controlMode
                ], (insertErr, insertResult) => {
                  if (insertErr) {
                    console.error('Insert error:', insertErr);
                    return res.status(500).json({ message: 'Failed to record attendance', error: insertErr.message });
                  }

                  console.log(`✅ Employee ${attendance_type} recorded:`, {
                    employee_id,
                    employee_name: fullName,
                    attendance_type,
                    time: now
                  });

                  res.status(201).json({
                    success: true,
                    message: `Employee ${attendance_type} recorded successfully`,
                    employee: {
                      employee_id: employee.employee_id,
                      first_name: employee.first_name,
                      last_name: employee.last_name,
                      full_name: fullName,
                      employee_type: employee.employee_type,
                      department: employee.department_name,
                      position: employee.position,
                      campus: employee.campus
                    },
                    attendance: {
                      id: insertResult.insertId,
                      attendance_type: attendance_type,
                      scan_time: now,
                      scan_date: today,
                      control_mode: controlMode,
                      status: 'present'
                    }
                  });
                });
              }
            );
          }
        );
    }
  );
});

// RECORD attendance (from QR/Smart Card scan)
router.post('/record', verifyToken, async (req, res) => {
  const { personType, studentId, employeeId, verificationMethod, location, deviceId } = req.body;

  // Validate input
  if (!personType) {
    return res.status(400).json({ error: 'personType is required (student or employee)' });
  }

  if (personType === 'student' && !studentId) {
    return res.status(400).json({ error: 'studentId is required for student attendance' });
  }

  if (personType === 'employee' && !employeeId) {
    return res.status(400).json({ error: 'employeeId is required for employee attendance' });
  }

  const attendanceId = `ATT-${uuidv4()}`;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];

  try {
    if (personType === 'student') {
      // Check if student exists in users table
      db.query(
        'SELECT * FROM users WHERE student_id = ?',
        [studentId],
        (err, results) => {
          if (err) {
            console.error('Student query error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
          }

          if (!results || results.length === 0) {
            return res.status(404).json({ error: `Student with ID ${studentId} not found` });
          }

          const student = results[0];

          // Check for duplicate attendance today (students can only check in once)
          db.query(
            'SELECT id FROM attendance WHERE person_type = ? AND student_id = ? AND attendance_date = ?',
            ['student', studentId, today],
            (dupErr, dupResults) => {
              if (dupErr) {
                console.error('Duplicate check error:', dupErr);
                return res.status(500).json({ error: 'Database error' });
              }

              if (dupResults && dupResults.length > 0) {
                return res.status(400).json({
                  status: 'duplicate',
                  message: 'Attendance already recorded for today',
                  studentId: studentId,
                  personName: student.full_name
                });
              }

              // Determine attendance status (present or late)
              let attendanceStatus = 'present';
              db.query(
                'SELECT config_value FROM attendance_config WHERE config_key = ?',
                ['LATE_THRESHOLD'],
                (configErr, configResults) => {
                  if (configResults && configResults.length > 0) {
                    const lateThreshold = configResults[0].config_value; // e.g., "08:15"
                    if (now > lateThreshold) {
                      attendanceStatus = 'late';
                    }
                  }

                  // Record attendance
                  const insertQuery = `
                    INSERT INTO attendance (
                      attendance_id, person_type, student_id, person_name, department_id, 
                      department_name, attendance_date, check_in_time, attendance_status, 
                      location, device_id, verification_method, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                  `;

                  db.query(insertQuery, [
                    attendanceId, 'student', studentId, student.full_name, 
                    student.department || null, student.department || null,
                    today, now, attendanceStatus, location || null, deviceId || null, 
                    verificationMethod || 'QR'
                  ], (insertErr) => {
                    if (insertErr) {
                      console.error('Insert error:', insertErr);
                      return res.status(500).json({ error: 'Failed to record attendance' });
                    }

                    res.status(201).json({
                      status: 'success',
                      message: 'Student attendance recorded successfully',
                      attendance: {
                        attendanceId: attendanceId,
                        studentId: studentId,
                        personName: student.full_name,
                        department: student.department,
                        checkInTime: now,
                        attendanceStatus: attendanceStatus
                      }
                    });
                  });
                }
              );
            }
          );
        }
      );

    } else if (personType === 'employee') {
      // Check if employee exists
      db.query(
        'SELECT * FROM employees WHERE employee_id = ?',
        [employeeId],
        (err, results) => {
          if (err) {
            console.error('Employee query error:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
          }

          if (!results || results.length === 0) {
            return res.status(404).json({ error: `Employee with ID ${employeeId} not found` });
          }

          const employee = results[0];

          // Check for open attendance (check-in without check-out)
          db.query(
            `SELECT id FROM attendance 
             WHERE person_type = ? AND employee_id = ? AND attendance_date = ? 
             AND check_in_time IS NOT NULL AND check_out_time IS NULL`,
            ['employee', employeeId, today],
            (dupErr, dupResults) => {
              if (dupErr) {
                console.error('Duplicate check error:', dupErr);
                return res.status(500).json({ error: 'Database error' });
              }

              if (dupResults && dupResults.length > 0) {
                // This is a check-out (second scan)
                const checkOutTime = now;
                db.query(
                  `UPDATE attendance 
                   SET check_out_time = ?, attendance_status = 'checked_out', updated_at = NOW() 
                   WHERE person_type = ? AND employee_id = ? AND attendance_date = ? 
                   AND check_out_time IS NULL`,
                  [checkOutTime, 'employee', employeeId, today],
                  (updateErr) => {
                    if (updateErr) {
                      console.error('Checkout update error:', updateErr);
                      return res.status(500).json({ error: 'Failed to record check-out' });
                    }

                    res.json({
                      status: 'checkout',
                      message: 'Employee check-out recorded successfully',
                      attendance: {
                        employeeId: employeeId,
                        personName: `${employee.first_name} ${employee.last_name}`,
                        checkOutTime: checkOutTime,
                        attendanceStatus: 'checked_out'
                      }
                    });
                  }
                );
              } else {
                // This is a check-in (first scan)
                let attendanceStatus = 'present';

                db.query(
                  'SELECT config_value FROM attendance_config WHERE config_key = ?',
                  ['LATE_THRESHOLD'],
                  (configErr, configResults) => {
                    if (configResults && configResults.length > 0) {
                      const lateThreshold = configResults[0].config_value;
                      if (now > lateThreshold) {
                        attendanceStatus = 'late';
                      }
                    }

                    const insertQuery = `
                      INSERT INTO attendance (
                        attendance_id, person_type, employee_id, person_name, 
                        department_id, department_name, attendance_date, 
                        check_in_time, attendance_status, location, device_id, 
                        verification_method, created_at
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `;

                    db.query(insertQuery, [
                      attendanceId, 'employee', employeeId, 
                      `${employee.first_name} ${employee.last_name}`,
                      employee.department_id || null, employee.department_name || null,
                      today, now, attendanceStatus, location || null, 
                      deviceId || null, verificationMethod || 'QR'
                    ], (insertErr) => {
                      if (insertErr) {
                        console.error('Insert error:', insertErr);
                        return res.status(500).json({ error: 'Failed to record check-in' });
                      }

                      res.status(201).json({
                        status: 'success',
                        message: 'Employee check-in recorded successfully',
                        attendance: {
                          attendanceId: attendanceId,
                          employeeId: employeeId,
                          personName: `${employee.first_name} ${employee.last_name}`,
                          department: employee.department_name,
                          position: employee.position,
                          checkInTime: now,
                          attendanceStatus: attendanceStatus
                        }
                      });
                    });
                  }
                );
              }
            }
          );
        }
      );
    } else {
      return res.status(400).json({ 
        error: `Invalid personType: ${personType}. Must be 'student' or 'employee'` 
      });
    }
  } catch (error) {
    console.error('Attendance record error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET attendance records
router.get('/', verifyToken, (req, res) => {
  const { personType, studentId, employeeId, departmentId, startDate, endDate, page = 1, limit = 50 } = req.query;

  let query = 'SELECT * FROM attendance WHERE 1=1';
  const params = [];

  if (personType) {
    query += ' AND person_type = ?';
    params.push(personType);
  }
  if (studentId) {
    query += ' AND student_id = ?';
    params.push(studentId);
  }
  if (employeeId) {
    query += ' AND employee_id = ?';
    params.push(employeeId);
  }
  if (departmentId) {
    query += ' AND department_id = ?';
    params.push(departmentId);
  }
  if (startDate) {
    query += ' AND attendance_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND attendance_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY attendance_date DESC, check_in_time DESC LIMIT ? OFFSET ?';
  const offset = (page - 1) * limit;
  params.push(parseInt(limit), offset);

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json({
      attendance: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: results.length
      }
    });
  });
});

// GET attendance for specific student
router.get('/student/:studentId', verifyToken, (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate } = req.query;

  // Decode studentId in case it's URL encoded
  const decodedStudentId = decodeURIComponent(studentId);

  let query = `SELECT a.* FROM attendance a 
               WHERE a.person_type = 'student' AND a.student_id = ?`;
  const params = [decodedStudentId];

  if (startDate) {
    query += ' AND a.attendance_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND a.attendance_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY a.attendance_date DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Student attendance query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Calculate summary
    const summary = {
      totalSessions: results.length,
      present: results.filter(a => a.attendance_status === 'present').length,
      late: results.filter(a => a.attendance_status === 'late').length,
      absent: results.filter(a => a.attendance_status === 'absent').length,
      excused: results.filter(a => a.attendance_status === 'excused').length,
      attendanceRate: results.length > 0 ? Math.round(((results.filter(a => a.attendance_status === 'present' || a.attendance_status === 'late').length) / results.length) * 100) : 0
    };

    res.json({
      attendance: results,
      summary: summary
    });
  });
});

// GET attendance for specific employee
router.get('/employee/:employeeId', verifyToken, (req, res) => {
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;

  // Decode employeeId in case it's URL encoded
  const decodedEmployeeId = decodeURIComponent(employeeId);

  let query = `SELECT a.* FROM attendance a 
               WHERE a.person_type = 'employee' AND a.employee_id = ?`;
  const params = [decodedEmployeeId];

  if (startDate) {
    query += ' AND a.attendance_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND a.attendance_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY a.attendance_date DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Employee attendance query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Calculate summary and working hours
    const summary = {
      totalDays: results.length,
      present: results.filter(a => a.attendance_status === 'present').length,
      late: results.filter(a => a.attendance_status === 'late').length,
      absent: results.filter(a => a.attendance_status === 'absent').length,
      excused: results.filter(a => a.attendance_status === 'excused').length,
      attendanceRate: results.length > 0 ? Math.round(((results.filter(a => a.attendance_status === 'present' || a.attendance_status === 'late').length) / results.length) * 100) : 0
    };

    res.json({
      attendance: results,
      summary: summary
    });
  });
});

// GET department attendance report
router.get('/department/:departmentId', verifyToken, (req, res) => {
  const { departmentId } = req.params;
  const { personType, startDate, endDate } = req.query;

  let query = 'SELECT person_type, COUNT(*) as total, SUM(CASE WHEN attendance_status = "present" THEN 1 ELSE 0 END) as present, SUM(CASE WHEN attendance_status = "late" THEN 1 ELSE 0 END) as late, SUM(CASE WHEN attendance_status = "absent" THEN 1 ELSE 0 END) as absent FROM attendance WHERE department_id = ?';
  const params = [departmentId];

  if (personType) {
    query += ' AND person_type = ?';
    params.push(personType);
  }
  if (startDate) {
    query += ' AND attendance_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND attendance_date <= ?';
    params.push(endDate);
  }

  query += ' GROUP BY person_type';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json({
      departmentReport: results
    });
  });
});

// GET daily attendance summary
router.get('/report/daily', verifyToken, adminOnly, (req, res) => {
  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split('T')[0];

  db.query(
    'SELECT * FROM attendance_daily_summary WHERE date = ?',
    [reportDate],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

// MANUAL attendance correction (Admin only)
router.post('/manual-correction', verifyToken, adminOnly, (req, res) => {
  const { attendanceId, newStatus, reason } = req.body;

  if (!attendanceId || !newStatus || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get old attendance record
  db.query('SELECT * FROM attendance WHERE attendance_id = ?', [attendanceId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'Attendance record not found' });

    const oldAttendance = results[0];
    const oldStatus = oldAttendance.attendance_status;

    // Update attendance
    db.query(
      'UPDATE attendance SET attendance_status = ?, updated_at = NOW() WHERE attendance_id = ?',
      [newStatus, attendanceId],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Failed to update attendance' });

        // Log the change
        const logQuery = `
          INSERT INTO attendance_audit_logs (attendance_id, action, old_value, new_value, changed_by, change_reason)
          VALUES (?, 'Modified', ?, ?, ?, ?)
        `;

        db.query(logQuery, [attendanceId, oldStatus, newStatus, req.user?.username || 'system', reason], (logErr) => {
          if (logErr) console.error('Audit log error:', logErr);

          res.json({
            message: 'Attendance corrected successfully',
            attendanceId: attendanceId,
            oldStatus: oldStatus,
            newStatus: newStatus,
            correction: {
              by: req.user?.username || 'system',
              reason: reason,
              timestamp: new Date()
            }
          });
        });
      }
    );
  });
});

// GET attendance audit logs
router.get('/audit-logs/:attendanceId', verifyToken, adminOnly, (req, res) => {
  db.query(
    'SELECT * FROM attendance_audit_logs WHERE attendance_id = ? ORDER BY created_at DESC',
    [req.params.attendanceId],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

// =====================================================
// EMPLOYEE ATTENDANCE GROUPED BY EMPLOYEE TYPE
// =====================================================

// GET attendance records grouped by employee_type
// Supports filtering by:
// - employee_type: Academic Staff, Administrative Staff, Technical Staff, Support Staff, Security Staff, Management
// - date: specific date (YYYY-MM-DD)
// - startDate & endDate: date range
// - department_id: filter by department
// - campus: filter by campus
// - attendance_status: present, late, absent, etc.
router.get('/employee-types', (req, res) => {
  const { 
    employee_type, 
    date, 
    startDate, 
    endDate, 
    department_id, 
    campus, 
    attendance_status 
  } = req.query;

  console.log('📊 /employee-types endpoint called with filters:', {
    employee_type,
    date,
    startDate,
    endDate,
    department_id,
    campus,
    attendance_status
  });

  // Build the base query - get all attendance records
  let baseQuery = `
    SELECT 
      ear.id,
      ear.employee_id,
      ear.employee_name,
      COALESCE(ear.employee_type, e.employee_type, 'Unassigned') as employee_type,
      COALESCE(ear.department, 'Unknown') as department,
      COALESCE(ear.campus, e.campus) as campus,
      COALESCE(ear.position, e.position) as position,
      ear.attendance_type,
      DATE_FORMAT(ear.scan_date, '%Y-%m-%d') as attendance_date,
      DATE_FORMAT(ear.scan_time, '%H:%i:%s') as scan_time,
      ear.status as attendance_status,
      ear.scan_timestamp,
      e.first_name,
      e.last_name,
      e.position as employee_position,
      e.employee_type as original_employee_type
    FROM employee_attendance_records ear
    LEFT JOIN employees e ON ear.employee_id = e.employee_id
    WHERE 1=1
  `;

  // Apply filters to base query
  const params = [];

  // Filter by employee_type if provided
  if (employee_type && employee_type !== 'All') {
    baseQuery += ` AND (COALESCE(ear.employee_type, e.employee_type) = ? OR e.employee_type = ?)`;
    params.push(employee_type);
    params.push(employee_type);
  }

  // Filter by specific date
  if (date) {
    baseQuery += ` AND DATE(ear.scan_date) = DATE(?)`;
    params.push(date);
    console.log(`   📅 Filtering by date: ${date}`);
  }

  // Filter by date range
  if (startDate) {
    baseQuery += ` AND DATE(ear.scan_date) >= DATE(?)`;
    params.push(startDate);
    console.log(`   📅 Start date filter: ${startDate}`);
  }

  if (endDate) {
    baseQuery += ` AND DATE(ear.scan_date) <= DATE(?)`;
    params.push(endDate);
    console.log(`   📅 End date filter: ${endDate}`);
  }

  // Filter by department
  if (department_id) {
    baseQuery += ` AND e.department_id = ?`;
    params.push(department_id);
  }

  // Filter by campus
  if (campus) {
    baseQuery += ` AND (ear.campus = ? OR e.campus = ?)`;
    params.push(campus);
    params.push(campus);
  }

  // Filter by attendance status
  if (attendance_status) {
    baseQuery += ` AND ear.status = ?`;
    params.push(attendance_status);
  }

  baseQuery += ` ORDER BY ear.scan_date DESC, ear.scan_time DESC`;

  console.log(`   🔍 Executing query with ${params.length} parameters`);

  // Execute the base query
  db.query(baseQuery, params, (err, results) => {
    if (err) {
      console.error('❌ Employee attendance query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    console.log(`   ✅ Query returned ${results.length} records`);

    // Post-process: Merge check-in and check-out records for the same employee on the same day
    const mergedRecords = {};
    
    results.forEach(record => {
      const key = `${record.employee_id}_${record.attendance_date}`;
      
      if (!mergedRecords[key]) {
        // Create new merged record
        mergedRecords[key] = {
          id: record.id,
          employee_id: record.employee_id,
          employee_name: record.employee_name,
          employee_type: record.employee_type,
          department: record.department,
          campus: record.campus,
          position: record.position,
          attendance_date: record.attendance_date,
          check_in_time: null,
          check_out_time: null,
          attendance_status: record.attendance_status,
          scan_timestamp: record.scan_timestamp,
          first_name: record.first_name,
          last_name: record.last_name,
          employee_position: record.employee_position,
          original_employee_type: record.original_employee_type
        };
      }
      
      // Add check-in or check-out time
      if (record.attendance_type === 'check-in') {
        mergedRecords[key].check_in_time = record.scan_time;
      } else if (record.attendance_type === 'check-out') {
        mergedRecords[key].check_out_time = record.scan_time;
      }
    });

    // Convert to array
    const finalResults = Object.values(mergedRecords);

    // Group results by employee_type
    const grouped = {};
    finalResults.forEach(record => {
      const staffType = record.employee_type || 'Unassigned';
      if (!grouped[staffType]) {
        grouped[staffType] = [];
      }
      grouped[staffType].push(record);
    });

    console.log(`   📋 Grouped into ${Object.keys(grouped).length} staff types:`, Object.keys(grouped));

    res.json({
      total: finalResults.length,
      by_employee_type: grouped,
      raw: finalResults
    });
  });
});

// GET list of unique employee types for filter dropdown
router.get('/employee-types-list', (req, res) => {
  const sql = `
    SELECT DISTINCT employee_type 
    FROM employees 
    WHERE employee_type IS NOT NULL AND employee_type != ''
    ORDER BY employee_type ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Employee types query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const types = results.map(r => r.employee_type);
    res.json({ employee_types: types });
  });
});

// GET attendance summary for employees by employee_type
router.get('/employee-summary', (req, res) => {
  const { date, startDate, endDate } = req.query;

  let sql = `
    SELECT 
      e.employee_type,
      COUNT(*) as total_employees,
      SUM(CASE WHEN a.attendance_status = 'present' THEN 1 ELSE 0 END) as present_count,
      SUM(CASE WHEN a.attendance_status = 'late' THEN 1 ELSE 0 END) as late_count,
      SUM(CASE WHEN a.attendance_status = 'absent' THEN 1 ELSE 0 END) as absent_count,
      DATE(a.attendance_date) as attendance_date
    FROM employees e
    LEFT JOIN attendance a ON e.employee_id = a.employee_id AND a.person_type = 'employee'
    WHERE e.employee_type IS NOT NULL AND e.employee_type != ''
  `;

  const params = [];

  if (date) {
    sql += ` AND DATE(a.attendance_date) = ?`;
    params.push(date);
  }

  if (startDate) {
    sql += ` AND DATE(a.attendance_date) >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    sql += ` AND DATE(a.attendance_date) <= ?`;
    params.push(endDate);
  }

  sql += ` GROUP BY e.employee_type, DATE(a.attendance_date) ORDER BY e.employee_type, DATE(a.attendance_date) DESC`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Employee summary query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ summary: results });
  });
});

// =====================================================
// CLEAR TODAY'S ATTENDANCE - EMPLOYEE
// =====================================================

// ADMIN ONLY: Clear all employee attendance records for today (fresh start)
router.delete('/clear-today-employees', verifyToken, adminOnly, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  console.log(`🔄 CLEAR TODAY'S EMPLOYEE ATTENDANCE REQUEST`);
  console.log(`   Date: ${today}`);
  console.log(`   Requested by: ${req.user?.username || 'admin'}`);

  // First, get count of records to be deleted from NEW table
  // Use DATE() function to compare only the date part, ignoring time
  // This handles both DATE and DATETIME column types
  db.query(
    'SELECT COUNT(*) as record_count FROM employee_attendance_records WHERE DATE(scan_date) = DATE(?)',
    [today],
    (countErr, countResults) => {
      if (countErr) {
        console.error('❌ Count error:', countErr);
        return res.status(500).json({ error: 'Database error', details: countErr.message });
      }

      const recordCount = countResults[0]?.record_count || 0;
      console.log(`   Found ${recordCount} attendance records to delete`);

      if (recordCount === 0) {
        return res.json({
          success: true,
          message: 'No employee attendance records to clear for today',
          date: today,
          recordsDeleted: 0,
          clearedBy: req.user?.username || 'admin',
          timestamp: new Date()
        });
      }

      // Delete today's employee attendance records from NEW table
      // Use DATE() function to compare only the date part, ignoring time
      db.query(
        'DELETE FROM employee_attendance_records WHERE DATE(scan_date) = DATE(?)',
        [today],
        (delErr, delResult) => {
          if (delErr) {
            console.error('❌ Delete error:', delErr);
            return res.status(500).json({ error: 'Failed to clear attendance', details: delErr.message });
          }

          console.log(`✅ CLEAR COMPLETED: Deleted ${delResult.affectedRows} employee attendance records`);

          res.json({
            success: true,
            message: `Employee attendance for ${today} has been cleared successfully`,
            date: today,
            recordsDeleted: delResult.affectedRows,
            clearedBy: req.user?.username || 'admin',
            timestamp: new Date(),
            note: 'All employee attendance records from today have been cleared. System is ready for the next day.'
          });
        }
      );
    }
  );
});

module.exports = router;
