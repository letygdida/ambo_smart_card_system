const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// =====================================================
// CAFETERIA ATTENDANCE ENDPOINTS - SEPARATE FROM MAIN ATTENDANCE
// =====================================================

// Simple test endpoint to verify routing
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Cafeteria API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/meal-status',
      '/today-summary', 
      '/records',
      '/scan'
    ]
  });
});

// MANUAL CONTROL - Set meal status (OPEN/CLOSE) - Admin Only
router.post('/control/:mealType', verifyToken, adminOnly, (req, res) => {
  const { mealType } = req.params;
  const { action } = req.body; // 'open' or 'close'

  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
    return res.status(400).json({ error: 'Invalid meal type' });
  }

  if (!['open', 'close'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "open" or "close"' });
  }

  // Add manual_status field to track manual overrides
  const query = `
    UPDATE meal_times_config 
    SET manual_status = ?, updated_at = NOW()
    WHERE meal_type = ?
  `;

  // First ensure the column exists
  db.query(
    'ALTER TABLE meal_times_config ADD COLUMN IF NOT EXISTS manual_status ENUM("open", "close", "auto") DEFAULT "auto"',
    (alterErr) => {
      if (alterErr) {
        console.error('Column add error (might already exist):', alterErr.message);
      }

      db.query(query, [action, mealType], (err, result) => {
        if (err) {
          console.error('Manual control error:', err);
          return res.status(500).json({ error: 'Database error', details: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Meal type not found' });
        }

        res.json({
          success: true,
          message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${action}ed successfully`,
          mealType,
          action,
          controlledBy: req.user?.username || 'admin',
          timestamp: new Date()
        });
      });
    }
  );
});

// MANUAL CONTROL - Reset all to automatic mode
router.post('/control-reset', verifyToken, adminOnly, (req, res) => {
  const query = `
    UPDATE meal_times_config 
    SET manual_status = 'auto', updated_at = NOW()
    WHERE 1=1
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Reset control error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.json({
      success: true,
      message: 'All meals reset to automatic time-based control',
      resetBy: req.user?.username || 'admin',
      timestamp: new Date()
    });
  });
});

// GET current meal status and times
router.get('/meal-status', (req, res) => {
  // First check if the table exists
  db.query('SHOW TABLES LIKE "meal_times_config"', (tableErr, tableResults) => {
    if (tableErr) {
      console.error('❌ Database connection error:', tableErr);
      return res.status(500).json({ 
        error: 'Database connection error', 
        details: tableErr.message,
        setup_required: true
      });
    }

    if (!tableResults || tableResults.length === 0) {
      console.error('❌ meal_times_config table not found');
      return res.status(500).json({ 
        error: 'Cafeteria system not set up', 
        message: 'meal_times_config table not found. Please run setup script.',
        setup_required: true
      });
    }

    // Table exists, proceed with normal query
    const query = `
      SELECT 
        meal_type,
        start_time,
        end_time,
        is_active,
        daily_limit,
        manual_status
      FROM meal_times_config
      WHERE is_active = TRUE
      ORDER BY 
        CASE 
          WHEN meal_type = 'breakfast' THEN 1
          WHEN meal_type = 'lunch' THEN 2
          WHEN meal_type = 'dinner' THEN 3
          ELSE 4
        END
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error('❌ Meal status query error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      // Get current time
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Find current meal
      let currentMeal = null;
      const mealStatus = {};

      for (const meal of results) {
        let isOpen = false;
        let controlMode = 'time-based';

        // Check manual override first
        if (meal.manual_status === 'open') {
          isOpen = true;
          controlMode = 'manually opened';
        } else if (meal.manual_status === 'close') {
          isOpen = false;
          controlMode = 'manually closed';
        } else {
          // Use time-based logic (auto mode or no manual_status)
          isOpen = currentTimeStr >= meal.start_time && currentTimeStr < meal.end_time;
          controlMode = 'time-based';
        }

        mealStatus[meal.meal_type] = {
          meal_type: meal.meal_type,
          start_time: meal.start_time,
          end_time: meal.end_time,
          is_open: isOpen,
          daily_limit: meal.daily_limit,
          manual_status: meal.manual_status || 'auto',
          control_mode: controlMode
        };

        if (isOpen) {
          currentMeal = meal.meal_type;
        }
      }

      res.json({
        success: true,
        currentTime: currentTimeStr,
        currentMeal,
        mealStatus,
        allMeals: results
      });
    });
  });
});

// Helper function: Determine meal type based on current time and manual controls
const getMealTypeFromTime = (timeStr = null) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT meal_type, start_time, end_time, manual_status
      FROM meal_times_config
      WHERE is_active = TRUE
    `;

    db.query(query, (err, results) => {
      if (err) {
        return reject(err);
      }

      const checkTime = timeStr || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

      for (const meal of results) {
        let isOpen = false;

        // Check manual override first
        if (meal.manual_status === 'open') {
          isOpen = true;
        } else if (meal.manual_status === 'close') {
          isOpen = false;
        } else {
          // Use time-based logic (auto mode)
          isOpen = checkTime >= meal.start_time && checkTime < meal.end_time;
        }

        if (isOpen) {
          return resolve(meal.meal_type);
        }
      }

      resolve(null); // No meal time matches
    });
  });
};

// RECORD CAFETERIA ATTENDANCE - Smart ID Scan
// POST /cafeteria/scan
router.post('/scan', async (req, res) => {
  const { studentId, scannerId, verificationMethod = 'smart_card' } = req.body;

  // Validation
  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required' });
  }

  if (!scannerId) {
    return res.status(400).json({ error: 'scannerId is required' });
  }

  try {
    // Step 1: Verify scanner is a CAFETERIA scanner
    const scannerCheckQuery = `
      SELECT id, location_type, location_name, campus, scanner_id
      FROM scanner_locations
      WHERE scanner_id = ? AND location_type = 'cafeteria' AND is_active = TRUE
    `;

    db.query(scannerCheckQuery, [scannerId], async (scanErr, scanResults) => {
      if (scanErr) {
        console.error('❌ Scanner check error:', scanErr);
        return res.status(500).json({ error: 'Database error', details: scanErr.message });
      }

      if (!scanResults || scanResults.length === 0) {
        return res.status(400).json({
          error: 'Invalid scanner',
          message: 'This scanner is not configured as a cafeteria scanner or is inactive',
          studentId
        });
      }

      const scanner = scanResults[0];

      // Step 2: Verify student exists
      const studentCheckQuery = `
        SELECT 
          u.student_id,
          u.full_name,
          u.department,
          u.year,
          s.status as student_status,
          s.id as student_record_id
        FROM users u
        LEFT JOIN students s ON u.student_id = s.student_id
        WHERE u.student_id = ? AND u.role = 'student'
      `;

      db.query(studentCheckQuery, [studentId], async (stdErr, stdResults) => {
        if (stdErr) {
          console.error('❌ Student check error:', stdErr);
          return res.status(500).json({ error: 'Database error', details: stdErr.message });
        }

        if (!stdResults || stdResults.length === 0) {
          return res.status(404).json({
            error: 'Student not found',
            message: `Student with ID ${studentId} not found or not active`,
            studentId
          });
        }

        const student = stdResults[0];
        const studentName = student.full_name || student.student_id;
        const studentStatus = student.student_status; // 'active' or 'blocked'

        console.log(`📌 Student check for ${studentId}: status = ${studentStatus}`);

        // Step 2A: CHECK IF STUDENT IS BLOCKED
        if (studentStatus === 'blocked') {
          const attendanceId = `ATT-CAFT-${uuidv4()}`;
          const now = new Date();
          const attendanceDateStr = now.toISOString().split('T')[0];
          const scanTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          console.log(`🔒 BLOCKED STUDENT DETECTED: ${studentId} - Denying cafeteria access`);

          // Record rejection for blocked student
          const rejectQuery = `
            INSERT IGNORE INTO cafeteria_attendance 
            (attendance_id, student_id, student_name, department_id, department_name, 
             meal_type, attendance_date, scan_time, scanner_id, scanner_location, 
             attendance_status, rejection_reason, verification_method, campus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            rejectQuery,
            [
              attendanceId, studentId, studentName, null,
              student.department || null, 'blocked', attendanceDateStr, scanTimeStr,
              scannerId, scanner.location_name, 'rejected_blocked_student',
              'Student ID is blocked. Cafeteria access is not allowed.', verificationMethod, scanner.campus || null
            ],
            (rejectErr) => {
              if (rejectErr) {
                console.error('❌ Rejection record error:', rejectErr);
              }
            }
          );

          return res.status(403).json({
            error: 'ACCESS DENIED',
            message: '🔒 ACCESS DENIED — Student ID is blocked. Cafeteria access is not allowed.',
            student: { 
              student_id: studentId, 
              name: studentName, 
              department: student.department,
              status: 'blocked'
            },
            status: 'access_denied_blocked',
            reason: 'Student account is blocked by administrator'
          });
        }

        // If status is active, proceed normally
        if (studentStatus !== 'active' && studentStatus !== null) {
          console.log(`⚠️ Warning: Student ${studentId} has unexpected status: ${studentStatus}`);
        }

        // Step 3: Check current time and determine meal type (with manual override support)
        const mealType = await getMealTypeFromTime();

        if (!mealType) {
          const attendanceId = `ATT-CAFT-${uuidv4()}`;
          const now = new Date();
          const attendanceDateStr = now.toISOString().split('T')[0];
          const scanTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          // Record rejection for cafeteria closed (no active meal)
          const rejectQuery = `
            INSERT IGNORE INTO cafeteria_attendance 
            (attendance_id, student_id, student_name, department_id, department_name, 
             meal_type, attendance_date, scan_time, scanner_id, scanner_location, 
             attendance_status, rejection_reason, verification_method, campus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            rejectQuery,
            [
              attendanceId, studentId, studentName, null,
              student.department || null, 'none', attendanceDateStr, scanTimeStr,
              scannerId, scanner.location_name, 'rejected_cafeteria_closed',
              'Cafeteria is currently CLOSED. No meal period is active at this time.', verificationMethod, scanner.campus || null
            ],
            (rejectErr) => {
              if (rejectErr) {
                console.error('❌ Rejection record error:', rejectErr);
              }
            }
          );

          return res.status(403).json({
            error: 'Cafeteria Closed',
            message: '🔒 Cafeteria is currently CLOSED. No meals are being served at this time.',
            student: { 
              student_id: studentId, 
              name: studentName, 
              department: student.department 
            },
            currentTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
            status: 'access_denied'
          });
        }

        // Step 4: Check if student already attended this meal today
        const attendanceDateStr = new Date().toISOString().split('T')[0];
        const duplicateCheckQuery = `
          SELECT id, attendance_status, scan_time
          FROM cafeteria_attendance
          WHERE student_id = ? AND meal_type = ? AND attendance_date = ?
          LIMIT 1
        `;

        db.query(duplicateCheckQuery, [studentId, mealType, attendanceDateStr], (dupErr, dupResults) => {
          if (dupErr) {
            console.error('❌ Duplicate check error:', dupErr);
            return res.status(500).json({ error: 'Database error', details: dupErr.message });
          }

          if (dupResults && dupResults.length > 0) {
            const attendanceId = `ATT-CAFT-${uuidv4()}`;
            const now = new Date();
            const scanTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            // Record duplicate rejection
            const rejectQuery = `
              INSERT IGNORE INTO cafeteria_attendance 
              (attendance_id, student_id, student_name, department_id, department_name, 
               meal_type, attendance_date, scan_time, scanner_id, scanner_location, 
               attendance_status, rejection_reason, verification_method, campus)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
              rejectQuery,
              [
                attendanceId, studentId, studentName, null,
                student.department || null, mealType, attendanceDateStr, scanTimeStr,
                scannerId, scanner.location_name, 'rejected_duplicate',
                `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} already attended today at ${dupResults[0].scan_time}`,
                verificationMethod, scanner.campus || null
              ],
              (rejectErr) => {
                if (rejectErr) {
                  console.error('❌ Rejection record error:', rejectErr);
                }
              }
            );

            return res.status(400).json({
              error: 'Duplicate attendance',
              message: `You have already attended ${mealType} today at ${dupResults[0].scan_time}`,
              meal: mealType,
              studentId,
              student: { student_id: studentId, name: studentName, department: student.department },
              previousScanTime: dupResults[0].scan_time
            });
          }

          // Step 5: Record successful attendance
          const attendanceId = `ATT-CAFT-${uuidv4()}`;
          const now = new Date();
          const scanTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          const insertQuery = `
            INSERT INTO cafeteria_attendance 
            (attendance_id, student_id, student_name, department_id, department_name, 
             meal_type, attendance_date, scan_time, scanner_id, scanner_location, 
             attendance_status, verification_method, campus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(
            insertQuery,
            [
              attendanceId, studentId, studentName, null,
              student.department || null, mealType, attendanceDateStr, scanTimeStr,
              scannerId, scanner.location_name, 'attended', verificationMethod, scanner.campus || null
            ],
            (insertErr) => {
              if (insertErr) {
                // Check if it's a unique constraint violation (duplicate key on uk_student_meal_date)
                if (insertErr.code === 'ER_DUP_ENTRY') {
                  return res.status(400).json({
                    error: 'Duplicate attendance (database enforced)',
                    message: `You have already attended ${mealType} today`,
                    meal: mealType,
                    studentId
                  });
                }

                console.error('❌ Insert error:', insertErr);
                return res.status(500).json({ error: 'Database error', details: insertErr.message });
              }

              res.status(201).json({
                success: true,
                message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} attendance recorded successfully`,
                attendance: {
                  attendanceId,
                  studentId,
                  studentName,
                  department: student.department,
                  mealType,
                  date: attendanceDateStr,
                  time: scanTimeStr,
                  scanner: scanner.location_name,
                  status: 'attended'
                }
              });
            }
          );
        });
      });
    });
  } catch (error) {
    console.error('❌ Cafeteria attendance error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// GET CAFETERIA ATTENDANCE - Today's Summary
router.get('/today-summary', (req, res) => {
  // First check if the cafeteria_attendance table exists
  db.query('SHOW TABLES LIKE "cafeteria_attendance"', (tableErr, tableResults) => {
    if (tableErr) {
      console.error('❌ Database connection error:', tableErr);
      return res.status(500).json({ 
        error: 'Database connection error', 
        details: tableErr.message 
      });
    }

    if (!tableResults || tableResults.length === 0) {
      console.error('❌ cafeteria_attendance table not found');
      return res.json({
        success: true,
        date: new Date().toISOString().split('T')[0],
        summary: {
          totalAttendance: 0,
          totalRejected: 0,
          totalScans: 0,
          byMeal: {}
        },
        message: 'No cafeteria attendance table found - showing empty summary'
      });
    }

    const today = new Date().toISOString().split('T')[0];

    const query = `
      SELECT 
        meal_type,
        COUNT(*) as total_scans,
        SUM(CASE WHEN attendance_status = 'attended' THEN 1 ELSE 0 END) as attended_count,
        SUM(CASE WHEN attendance_status LIKE 'rejected%' THEN 1 ELSE 0 END) as rejected_count,
        COUNT(DISTINCT student_id) as unique_students
      FROM cafeteria_attendance
      WHERE attendance_date = ?
      GROUP BY meal_type
      ORDER BY 
        CASE 
          WHEN meal_type = 'breakfast' THEN 1
          WHEN meal_type = 'lunch' THEN 2
          WHEN meal_type = 'dinner' THEN 3
          ELSE 4
        END
    `;

    db.query(query, [today], (err, results) => {
      if (err) {
        console.error('❌ Today summary error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      // Calculate totals
      let totalAttendance = 0;
      let totalRejected = 0;
      const mealSummary = {};

      for (const row of results) {
        totalAttendance += parseInt(row.attended_count) || 0;
        totalRejected += parseInt(row.rejected_count) || 0;
        mealSummary[row.meal_type] = {
          attended: parseInt(row.attended_count) || 0,
          rejected: parseInt(row.rejected_count) || 0,
          total: parseInt(row.total_scans) || 0,
          uniqueStudents: parseInt(row.unique_students) || 0
        };
      }

      res.json({
        success: true,
        date: today,
        summary: {
          totalAttendance,
          totalRejected,
          totalScans: totalAttendance + totalRejected,
          byMeal: mealSummary
        }
      });
    });
  });
});

// GET CAFETERIA ATTENDANCE RECORDS - With Filters
router.get('/records', (req, res) => {
  const { mealType, date, department, studentId, status, page = 1, limit = 20 } = req.query;

  let query = `
    SELECT 
      ca.attendance_id,
      ca.student_id,
      ca.student_name,
      ca.department_name,
      ca.meal_type,
      ca.attendance_date,
      ca.scan_time,
      ca.attendance_status,
      ca.rejection_reason,
      ca.scanner_location,
      ca.verification_method,
      ca.created_at
    FROM cafeteria_attendance ca
    WHERE 1=1
  `;

  const params = [];

  if (mealType) {
    query += ` AND ca.meal_type = ?`;
    params.push(mealType.toLowerCase());
  }

  if (date) {
    query += ` AND DATE(ca.attendance_date) = ?`;
    params.push(date);
  } else {
    // Default to today if no date specified
    query += ` AND DATE(ca.attendance_date) = CURDATE()`;
  }

  if (department) {
    query += ` AND ca.department_name LIKE ?`;
    params.push(`%${department}%`);
  }

  if (studentId) {
    query += ` AND ca.student_id LIKE ?`;
    params.push(`%${studentId}%`);
  }

  if (status) {
    query += ` AND ca.attendance_status = ?`;
    params.push(status);
  }

  // Pagination
  const offset = (page - 1) * limit;
  query += ` ORDER BY ca.scan_time DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Records query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM cafeteria_attendance ca WHERE 1=1`;
    const countParams = [];

    if (mealType) {
      countQuery += ` AND ca.meal_type = ?`;
      countParams.push(mealType.toLowerCase());
    }
    if (date) {
      countQuery += ` AND DATE(ca.attendance_date) = ?`;
      countParams.push(date);
    } else {
      countQuery += ` AND DATE(ca.attendance_date) = CURDATE()`;
    }
    if (department) {
      countQuery += ` AND ca.department_name LIKE ?`;
      countParams.push(`%${department}%`);
    }
    if (studentId) {
      countQuery += ` AND ca.student_id LIKE ?`;
      countParams.push(`%${studentId}%`);
    }
    if (status) {
      countQuery += ` AND ca.attendance_status = ?`;
      countParams.push(status);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        console.error('❌ Count query error:', countErr);
        return res.status(500).json({ error: 'Database error', details: countErr.message });
      }

      const total = countResults[0].total;

      res.json({
        success: true,
        records: results,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    });
  });
});

// GET CAFETERIA ATTENDANCE BY DATE RANGE
router.get('/report', (req, res) => {
  const { startDate, endDate, mealType, department } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  let query = `
    SELECT 
      ca.attendance_date,
      ca.meal_type,
      ca.department_name,
      COUNT(*) as total_scans,
      SUM(CASE WHEN ca.attendance_status = 'attended' THEN 1 ELSE 0 END) as attended_count,
      SUM(CASE WHEN ca.attendance_status LIKE 'rejected%' THEN 1 ELSE 0 END) as rejected_count,
      COUNT(DISTINCT ca.student_id) as unique_students
    FROM cafeteria_attendance ca
    WHERE DATE(ca.attendance_date) BETWEEN ? AND ?
  `;

  const params = [startDate, endDate];

  if (mealType) {
    query += ` AND ca.meal_type = ?`;
    params.push(mealType.toLowerCase());
  }

  if (department) {
    query += ` AND ca.department_name LIKE ?`;
    params.push(`%${department}%`);
  }

  query += ` GROUP BY ca.attendance_date, ca.meal_type, ca.department_name
             ORDER BY ca.attendance_date DESC, 
              CASE 
                WHEN ca.meal_type = 'breakfast' THEN 1
                WHEN ca.meal_type = 'lunch' THEN 2
                WHEN ca.meal_type = 'dinner' THEN 3
                ELSE 4
              END`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Report query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.json({
      success: true,
      report: {
        startDate,
        endDate,
        records: results,
        summary: {
          totalRecords: results.length,
          totalAttendance: results.reduce((sum, r) => sum + r.attended_count, 0),
          totalRejected: results.reduce((sum, r) => sum + r.rejected_count, 0)
        }
      }
    });
  });
});

// =====================================================
// RESET ENDPOINTS - Clear attendance records
// =====================================================

// Debugging middleware for cafeteria endpoints
const debugCafeteria = (req, res, next) => {
  console.log(`🔍 Cafeteria request: ${req.method} ${req.path}`);
  console.log(`   Auth header: ${req.headers.authorization ? 'Present' : 'MISSING'}`);
  console.log(`   User: ${req.user ? `${req.user.username} (${req.user.role})` : 'NOT SET'}`);
  next();
};

// Apply debugging to all cafeteria routes
router.use(debugCafeteria);

// RESET TODAY'S CAFETERIA ATTENDANCE - Admin Only
// DELETE all today's attendance records for a fresh start tomorrow
router.post('/reset-today', verifyToken, adminOnly, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  console.log(`🔄 RESET REQUEST: Clearing all cafeteria attendance for ${today}`);
  console.log(`   Requested by: ${req.user?.username || 'admin'}`);

  // First, get count of records to be deleted
  db.query(
    'SELECT COUNT(*) as record_count FROM cafeteria_attendance WHERE attendance_date = ?',
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
          message: 'No attendance records to reset for today',
          date: today,
          recordsDeleted: 0,
          resetBy: req.user?.username || 'admin',
          timestamp: new Date()
        });
      }

      // Delete today's records
      db.query(
        'DELETE FROM cafeteria_attendance WHERE attendance_date = ?',
        [today],
        (delErr, delResult) => {
          if (delErr) {
            console.error('❌ Delete error:', delErr);
            return res.status(500).json({ error: 'Failed to reset attendance', details: delErr.message });
          }

          console.log(`✅ RESET COMPLETED: Deleted ${delResult.affectedRows} records`);

          res.json({
            success: true,
            message: `Cafeteria attendance for ${today} has been reset successfully`,
            date: today,
            recordsDeleted: delResult.affectedRows,
            resetBy: req.user?.username || 'admin',
            timestamp: new Date(),
            note: 'All records from today have been cleared. System is ready for the next day.'
          });
        }
      );
    }
  );
});

// RESET SPECIFIC DATE ATTENDANCE - Admin Only
// DELETE all attendance records for a specific date
router.post('/reset-date', verifyToken, adminOnly, (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required (format: YYYY-MM-DD)' });
  }

  console.log(`🔄 RESET REQUEST: Clearing cafeteria attendance for ${date}`);
  console.log(`   Requested by: ${req.user?.username || 'admin'}`);

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // First, get count of records to be deleted
  db.query(
    'SELECT COUNT(*) as record_count FROM cafeteria_attendance WHERE attendance_date = ?',
    [date],
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
          message: `No attendance records to reset for ${date}`,
          date,
          recordsDeleted: 0,
          resetBy: req.user?.username || 'admin',
          timestamp: new Date()
        });
      }

      // Delete records for specified date
      db.query(
        'DELETE FROM cafeteria_attendance WHERE attendance_date = ?',
        [date],
        (delErr, delResult) => {
          if (delErr) {
            console.error('❌ Delete error:', delErr);
            return res.status(500).json({ error: 'Failed to reset attendance', details: delErr.message });
          }

          console.log(`✅ RESET COMPLETED: Deleted ${delResult.affectedRows} records for ${date}`);

          res.json({
            success: true,
            message: `Cafeteria attendance for ${date} has been reset successfully`,
            date,
            recordsDeleted: delResult.affectedRows,
            resetBy: req.user?.username || 'admin',
            timestamp: new Date()
          });
        }
      );
    }
  );
});

// DELETE SPECIFIC ATTENDANCE RECORD - Admin Only
// DELETE a single attendance record by ID
router.delete('/record/:attendanceId', verifyToken, adminOnly, (req, res) => {
  const { attendanceId } = req.params;

  if (!attendanceId) {
    return res.status(400).json({ error: 'Attendance ID is required' });
  }

  console.log(`🗑️ DELETE REQUEST: Removing attendance record ${attendanceId}`);
  console.log(`   Requested by: ${req.user?.username || 'admin'}`);

  // First, get the record to be deleted (for logging)
  db.query(
    'SELECT * FROM cafeteria_attendance WHERE attendance_id = ? LIMIT 1',
    [attendanceId],
    (getErr, getResults) => {
      if (getErr) {
        console.error('❌ Get record error:', getErr);
        return res.status(500).json({ error: 'Database error', details: getErr.message });
      }

      if (!getResults || getResults.length === 0) {
        console.log(`❌ Record not found: ${attendanceId}`);
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      const record = getResults[0];
      console.log(`   Record: ${record.student_id} - ${record.meal_type} - ${record.scan_time}`);

      // Delete the record
      db.query(
        'DELETE FROM cafeteria_attendance WHERE attendance_id = ?',
        [attendanceId],
        (delErr, delResult) => {
          if (delErr) {
            console.error('❌ Delete error:', delErr);
            return res.status(500).json({ error: 'Failed to delete record', details: delErr.message });
          }

          console.log(`✅ RECORD DELETED: ${attendanceId}`);

          res.json({
            success: true,
            message: 'Attendance record deleted successfully',
            attendanceId,
            deletedRecord: {
              student_id: record.student_id,
              student_name: record.student_name,
              meal_type: record.meal_type,
              scan_time: record.scan_time,
              status: record.attendance_status
            },
            deletedBy: req.user?.username || 'admin',
            timestamp: new Date()
          });
        }
      );
    }
  );
});

// DELETE MULTIPLE ATTENDANCE RECORDS - Admin Only
// DELETE selected attendance records by IDs
router.post('/delete-multiple', verifyToken, adminOnly, (req, res) => {
  const { attendanceIds } = req.body;

  if (!attendanceIds || !Array.isArray(attendanceIds) || attendanceIds.length === 0) {
    return res.status(400).json({ error: 'attendanceIds array is required and must not be empty' });
  }

  console.log(`🗑️ BULK DELETE REQUEST: Removing ${attendanceIds.length} attendance records`);
  console.log(`   Requested by: ${req.user?.username || 'admin'}`);

  // First, get the records to be deleted (for logging)
  const placeholders = attendanceIds.map(() => '?').join(',');
  db.query(
    `SELECT * FROM cafeteria_attendance WHERE attendance_id IN (${placeholders})`,
    attendanceIds,
    (getErr, getResults) => {
      if (getErr) {
        console.error('❌ Get records error:', getErr);
        return res.status(500).json({ error: 'Database error', details: getErr.message });
      }

      console.log(`   Found ${getResults?.length || 0} records to delete`);

      if (!getResults || getResults.length === 0) {
        return res.status(404).json({ error: 'No attendance records found' });
      }

      // Delete the records
      db.query(
        `DELETE FROM cafeteria_attendance WHERE attendance_id IN (${placeholders})`,
        attendanceIds,
        (delErr, delResult) => {
          if (delErr) {
            console.error('❌ Delete error:', delErr);
            return res.status(500).json({ error: 'Failed to delete records', details: delErr.message });
          }

          console.log(`✅ BULK DELETE COMPLETED: Deleted ${delResult.affectedRows} records`);

          res.json({
            success: true,
            message: `${delResult.affectedRows} attendance record(s) deleted successfully`,
            recordsDeleted: delResult.affectedRows,
            deletedRecords: getResults.map(r => ({
              attendance_id: r.attendance_id,
              student_id: r.student_id,
              student_name: r.student_name,
              meal_type: r.meal_type,
              scan_time: r.scan_time,
              status: r.attendance_status
            })),
            deletedBy: req.user?.username || 'admin',
            timestamp: new Date()
          });
        }
      );
    }
  );
});

// Debug: Log all routes in this module
console.log('📋 Cafeteria Attendance Routes:');
if (router.stack) {
  const routes = router.stack
    .filter(layer => layer.route)
    .map(layer => {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      return `${methods} ${layer.route.path}`;
    });
  routes.forEach(r => console.log(`   ${r}`));
  console.log(`   Total: ${routes.length} routes`);
}

module.exports = router;
