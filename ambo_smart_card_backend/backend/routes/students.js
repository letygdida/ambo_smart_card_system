const express = require("express");
const db = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// PHOTO STORAGE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// ===== GET - FETCH ALL STUDENTS FROM USERS TABLE =====
router.get("/", verifyToken, (req, res) => {
    console.log('📋 GET /api/students - Fetching all students...');

    db.query(
        `SELECT 
            s.id,
            u.id as user_id,
            s.student_id,
            u.username,
            u.full_name,
            u.department,
            u.year,
            u.personal_email,
            u.phone_number,
            u.emergency_contact_phone,
            u.photo,
            s.smart_card_id,
            s.status,
            u.registration_status,
            u.profile_completed
        FROM students s
        JOIN users u ON s.student_id = u.student_id
        ORDER BY s.id DESC`,
        (err, result) => {
            if (err) {
                console.error('❌ Error fetching students:', err);
                return res.status(500).json({
                    error: err.message,
                    message: 'Failed to fetch students'
                });
            }

            console.log(`✓ Found ${result.length} students`);
            res.json(result);
        }
    );
});

// ===== POST - ADD NEW STUDENT =====
router.post("/add", verifyToken, upload.fields([
    { name: 'photo', maxCount: 1 }
]), (req, res) => {
    console.log('POST /api/students/add - Adding new student');
    
    // Parse FormData fields
    const student_id = req.body.student_id;
    const name = req.body.name;
    const department = req.body.department;
    const year = req.body.year;
    const personal_email = req.body.personal_email || '';
    const phone_number = req.body.phone_number || '';
    const emergency_contact = req.body.emergency_contact || '';

    let photoFilename = null;

    // Handle file upload if present
    // multer (upload.fields) already saves the file to disk via diskStorage.
    // req.files.photo is an array of multer file objects — use [0].filename directly.
    if (req.files && req.files.photo && req.files.photo.length > 0) {
        photoFilename = req.files.photo[0].filename;
        console.log(`📸 Photo saved by multer: ${photoFilename}`);
    }

    console.log(`➕ ADD STUDENT request: ${student_id} - ${name}`);

    if (!student_id || !name || !department || !year) {
        return res.status(400).json({
            error: "Student ID, Name, Department, and Year are required"
        });
    }

    // Check if student_id already exists
    db.query(
        "SELECT id FROM users WHERE student_id = ?",
        [student_id],
        (err, existing) => {
            if (err) {
                console.error(`❌ Error checking student ID: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }

            if (existing && existing.length > 0) {
                return res.status(400).json({
                    error: "Student ID already exists"
                });
            }

            // Insert into users table
            const sql = `
                INSERT INTO users 
                (username, password, role, student_id, full_name, department, year, 
                 personal_email, phone_number, emergency_contact_phone, photo, 
                 registration_status, profile_completed, card_status, approved_at) 
                VALUES (?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, 'active', NOW())
            `;

            db.query(
                sql,
                [name, 'default123', student_id, name, department, year, 
                 personal_email || '', phone_number || '', emergency_contact || '', photoFilename],
                (err, result) => {
                    if (err) {
                        console.error(`❌ Error adding student to users: ${err.message}`);
                        return res.status(500).json({
                            error: err.message,
                            message: "Error adding student"
                        });
                    }

                    const userId = result.insertId;
                    console.log(`✅ Student added to users table with ID: ${userId}`);

                    // Now insert into students table
                    const studentTableSql = `
                        INSERT INTO students 
                        (student_id, status)
                        VALUES (?, ?)
                    `;

                    db.query(
                        studentTableSql,
                        [student_id, 'active'],
                        (err2, result2) => {
                            if (err2) {
                                console.error(`❌ Error adding student to students table: ${err2.message}`);
                                return res.json({
                                    success: true,
                                    message: "Student added successfully (note: added to users table only)",
                                    id: userId,
                                    warning: "Could not create students record"
                                });
                            }

                            console.log(`✅ Student added to students table with ID: ${result2.insertId}`);
                            res.json({
                                success: true,
                                message: "Student added successfully",
                                id: userId,
                                studentRecordId: result2.insertId
                            });
                        }
                    );
                }
            );
        }
    );
});

// ===== PUT - UPDATE STUDENT STATUS (MUST COME BEFORE PUT /:id) =====
router.put("/:id/status", verifyToken, (req, res) => {
    const idParam = req.params.id;
    const { status } = req.body;

    console.log(`🔄 Status update request received`);
    console.log(`   ID param: ${idParam}`);
    console.log(`   New status: ${status}`);
    console.log(`   User: ${req.user.username}`);

    if (!status || (status !== 'active' && status !== 'blocked')) {
        return res.status(400).json({ error: "Status must be 'active' or 'blocked'" });
    }

    // Check what this ID is (students.id or users.id)
    db.query(
        "SELECT id FROM students WHERE id=? LIMIT 1",
        [idParam],
        (checkErr, checkResult) => {
            if (checkErr) {
                console.error(`❌ Error checking ID: ${checkErr.message}`);
                return res.status(500).json({ error: checkErr.message });
            }

            if (checkResult && checkResult.length > 0) {
                // ID is a students.id
                console.log(`✓ Found record in students table with id=${idParam}`);
                
                db.query(
                    "UPDATE students SET status=? WHERE id=?",
                    [status, idParam],
                    (err, result) => {
                        if (err) {
                            console.error(`❌ Update error: ${err.message}`);
                            return res.status(500).json({ error: err.message });
                        }
                        
                        console.log(`✅ Updated ${result.affectedRows} row(s)`);
                        return res.json({
                            success: true,
                            message: `Student ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`
                        });
                    }
                );
            } else {
                // ID not found in students table
                console.log(`❌ No student record found with id=${idParam}`);
                console.log(`   Checking if it's a users.id...`);
                
                db.query(
                    "SELECT id, student_id FROM users WHERE id=? LIMIT 1",
                    [idParam],
                    (userErr, userResult) => {
                        if (userErr) {
                            console.error(`❌ Error checking users table: ${userErr.message}`);
                            return res.status(500).json({ error: userErr.message });
                        }

                        if (userResult && userResult.length > 0) {
                            console.log(`✓ Found record in users table with id=${idParam}`);
                            const userStudentId = userResult[0].student_id;
                            console.log(`   Student ID: ${userStudentId}`);
                            
                            // Update using student_id
                            db.query(
                                "UPDATE students SET status=? WHERE student_id=?",
                                [status, userStudentId],
                                (err, result) => {
                                    if (err) {
                                        console.error(`❌ Update error: ${err.message}`);
                                        return res.status(500).json({ error: err.message });
                                    }
                                    
                                    console.log(`✅ Updated ${result.affectedRows} row(s)`);
                                    return res.json({
                                        success: true,
                                        message: `Student ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`
                                    });
                                }
                            );
                        } else {
                            console.log(`❌ Record not found in either table: ${idParam}`);
                            return res.status(404).json({ error: "Student not found" });
                        }
                    }
                );
            }
        }
    );
});

// ===== DELETE - DELETE STUDENT =====
router.delete("/:id", verifyToken, adminOnly, (req, res) => {
    const studentId = req.params.id;  // This is students.id
    
    console.log(`🗑️ DELETE request for student ID: ${studentId}, User: ${req.user.username}`);

    // Get student_id to also delete from users table
    db.query(
        "SELECT student_id FROM students WHERE id=?",
        [studentId],
        (err, results) => {
            if (err) {
                console.error(`❌ Error fetching student: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }

            if (!results || results.length === 0) {
                console.log(`❌ No record found: ${studentId}`);
                return res.status(404).json({ error: "Student not found" });
            }

            const studentIdValue = results[0].student_id;
            console.log(`✓ Found student with ID: ${studentId}, student_id: ${studentIdValue}`);

            // Delete from students table first
            db.query(
                "DELETE FROM students WHERE id=?",
                [studentId],
                (err1, result1) => {
                    if (err1) {
                        console.error(`❌ Error deleting from students: ${err1.message}`);
                        return res.status(500).json({ error: err1.message });
                    }

                    console.log(`✅ Deleted from students table. Rows: ${result1.affectedRows}`);

                    // Also delete from users table
                    db.query(
                        "DELETE FROM users WHERE student_id=?",
                        [studentIdValue],
                        (err2, result2) => {
                            if (err2) {
                                console.error(`⚠️ Warning deleting from users: ${err2.message}`);
                            }
                            
                            console.log(`✅ Deleted from users table. Rows: ${result2?.affectedRows || 0}`);
                            res.json({
                                success: true,
                                message: "Student deleted successfully"
                            });
                        }
                    );
                }
            );
        }
    );
});

// ===== PUT - UPDATE STUDENT (EDIT) =====
router.put("/:id", verifyToken, (req, res, next) => {
    console.log(`📝 UPDATE request for ID: ${req.params.id}`);
    upload.single("photo")(req, res, (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (req, res) => {
    const userId = req.params.id;
    const {
        name,
        department,
        year,
        personal_email,
        phone_number,
        emergency_contact
    } = req.body;

    const photo = req.file ? req.file.filename : null;

    console.log(`Updating student ${userId}: name=${name}, dept=${department}, year=${year}`);

    if (!name || !department || !year) {
        return res.status(400).json({
            error: "Name, Department, and Year are required"
        });
    }

    let sql, params;

    if (photo) {
        sql = `
            UPDATE users 
            SET username=?, full_name=?, department=?, year=?, 
                personal_email=?, phone_number=?, emergency_contact_phone=?, photo=?
            WHERE id=?
        `;
        params = [name, name, department, year, 
                 personal_email || '', phone_number || '', emergency_contact || '', photo, userId];
    } else {
        sql = `
            UPDATE users 
            SET username=?, full_name=?, department=?, year=?, 
                personal_email=?, phone_number=?, emergency_contact_phone=?
            WHERE id=?
        `;
        params = [name, name, department, year, 
                 personal_email || '', phone_number || '', emergency_contact || '', userId];
    }

    db.query(sql, params, (err, updateResult) => {
        if (err) {
            console.error(`❌ Error updating: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }

        if (updateResult.affectedRows === 0) {
            console.log(`❌ No record found to update: ${userId}`);
            return res.status(404).json({ error: "Student not found" });
        }

        console.log(`✅ Student updated. Rows affected: ${updateResult.affectedRows}`);
        res.json({
            success: true,
            message: "Student updated successfully"
        });
    });
});

// ===== GET STUDENT INFO FOR SMART CARD =====
router.get("/info/:student_id", verifyToken, (req, res) => {
    const student_id = decodeURIComponent(req.params.student_id);
    
    console.log(`📚 Fetching student info for: ${student_id}`);
    
    const sql = `
        SELECT 
            u.id,
            u.student_id,
            u.username,
            u.full_name,
            u.department,
            u.year,
            u.personal_email,
            u.phone_number,
            u.emergency_contact_phone,
            u.photo,
            u.card_status as status
        FROM users u
        WHERE u.student_id = ? AND u.role = 'student'
    `;
    
    db.query(sql, [student_id], (err, results) => {
        if (err) {
            console.error("Error fetching student:", err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }
        
        res.json(results[0]);
    });
});

// ===== GET STUDENT ATTENDANCE =====
router.get("/:student_id/attendance", verifyToken, (req, res) => {
    const student_id = decodeURIComponent(req.params.student_id);

    const sql = `
        SELECT 
          a.id,
          a.attendance_id,
          a.attendance_date,
          a.check_in_time,
          a.check_out_time,
          a.attendance_status,
          a.person_type,
          a.person_name,
          a.department_name,
          a.verification_method,
          a.location
        FROM attendance a
        WHERE a.person_type = 'student' AND a.student_id = ?
        ORDER BY a.attendance_date DESC, a.check_in_time DESC
    `;

    db.query(sql, [student_id], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                message: 'No attendance records found'
            });
        }

        const summary = {
            totalRecords: result.length,
            present: result.filter(r => r.attendance_status === 'present').length,
            late: result.filter(r => r.attendance_status === 'late').length,
            absent: result.filter(r => r.attendance_status === 'absent').length
        };

        res.json({
            studentId: student_id,
            attendance: result,
            summary: summary
        });
    });
});

module.exports = router;
