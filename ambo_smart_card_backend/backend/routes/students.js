const express = require("express");
const db = require("../db");
const { verifyToken } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// PHOTO STORAGE via multer diskStorage
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadsDir); },
    filename: (req, file, cb) => { cb(null, Date.now() + "-" + file.originalname); }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// ===== GET ALL STUDENTS =====
// Reads from the actual `students` table schema:
//   id, student_id, first_name, last_name, email, phone,
//   department_id, level, photo_path, card_status, card_number, status
router.get("/", verifyToken, (req, res) => {
    console.log('GET /api/students');
    db.query(
        `SELECT
            s.id,
            s.student_id,
            CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) AS username,
            CONCAT(s.first_name, ' ', COALESCE(s.last_name, '')) AS full_name,
            s.first_name,
            s.last_name,
            s.email         AS personal_email,
            s.phone         AS phone_number,
            d.name          AS department,
            s.department_id,
            s.level         AS year,
            s.photo_path    AS photo,
            s.card_status,
            s.card_number   AS smart_card_id,
            s.status
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.id
        ORDER BY s.id DESC`,
        (err, result) => {
            if (err) {
                console.error('Error fetching students:', err.message);
                return res.status(500).json({ error: err.message, message: 'Failed to fetch students' });
            }
            console.log(`Found ${result.length} students`);
            res.json(result);
        }
    );
});

// ===== POST - ADD NEW STUDENT (JSON body) =====
// Frontend sends: student_id, name, department (name string), year, personal_email, phone_number, emergency_contact
router.post("/add", verifyToken, (req, res) => {
    console.log('POST /api/students/add');
    console.log('Body:', JSON.stringify(req.body));

    const student_id = (req.body.student_id || '').toString().trim();
    const name       = (req.body.name       || '').toString().trim();
    const department = (req.body.department || '').toString().trim();
    const year       = (req.body.year       || '').toString().trim();
    const email      = (req.body.personal_email || '').toString().trim();
    const phone      = (req.body.phone_number   || '').toString().trim();

    console.log(`ADD STUDENT: id="${student_id}" name="${name}" dept="${department}" year="${year}"`);

    if (!student_id || !name || !department || !year) {
        return res.status(400).json({
            error: "Student ID, Name, Department, and Year are required"
        });
    }

    // Split name into first_name / last_name
    const parts = name.split(' ');
    const first_name = parts[0] || name;
    const last_name  = parts.slice(1).join(' ') || '';

    // Check duplicate student_id
    db.query("SELECT id FROM students WHERE student_id = ?", [student_id], (err, existing) => {
        if (err) return res.status(500).json({ error: err.message });
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: "Student ID already exists" });
        }

        // Resolve department name → department_id
        db.query("SELECT id FROM departments WHERE name = ? OR code = ?", [department, department], (err, deptRows) => {
            if (err) return res.status(500).json({ error: err.message });

            const department_id = (deptRows && deptRows.length > 0) ? deptRows[0].id : null;

            const sql = `
                INSERT INTO students
                    (student_id, first_name, last_name, email, phone, department_id, level, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
            `;
            db.query(sql, [student_id, first_name, last_name, email || null, phone || null, department_id, parseInt(year) || null], (err, result) => {
                if (err) {
                    console.error('Insert error:', err.message);
                    return res.status(500).json({ error: err.message });
                }
                console.log(`Student added with DB id=${result.insertId}`);
                res.json({ success: true, message: "Student added successfully", id: result.insertId });
            });
        });
    });
});

// ===== PUT - UPDATE STUDENT STATUS =====
router.put("/:id/status", verifyToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'blocked'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'active' or 'blocked'" });
    }

    db.query("UPDATE students SET status=? WHERE id=?", [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ success: true, message: `Student ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully` });
    });
});

// ===== DELETE STUDENT =====
router.delete("/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    console.log(`DELETE student id=${id}`);

    db.query("DELETE FROM students WHERE id=?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ success: true, message: "Student deleted successfully" });
    });
});

// ===== PUT - UPDATE STUDENT (EDIT) — accepts FormData for photo =====
router.put("/:id", verifyToken, (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, (req, res) => {
    const { id } = req.params;
    const name       = (req.body.name       || '').toString().trim();
    const department = (req.body.department || '').toString().trim();
    const year       = (req.body.year       || '').toString().trim();
    const email      = (req.body.personal_email || '').toString().trim();
    const phone      = (req.body.phone_number   || '').toString().trim();
    const photo      = req.file ? req.file.filename : null;

    if (!name || !department || !year) {
        return res.status(400).json({ error: "Name, Department, and Year are required" });
    }

    const parts = name.split(' ');
    const first_name = parts[0] || name;
    const last_name  = parts.slice(1).join(' ') || '';

    // Resolve department name → id
    db.query("SELECT id FROM departments WHERE name = ? OR code = ?", [department, department], (err, deptRows) => {
        if (err) return res.status(500).json({ error: err.message });
        const department_id = (deptRows && deptRows.length > 0) ? deptRows[0].id : null;

        let sql, params;
        if (photo) {
            sql = `UPDATE students SET first_name=?, last_name=?, email=?, phone=?, department_id=?, level=?, photo_path=? WHERE id=?`;
            params = [first_name, last_name, email || null, phone || null, department_id, parseInt(year) || null, photo, id];
        } else {
            sql = `UPDATE students SET first_name=?, last_name=?, email=?, phone=?, department_id=?, level=? WHERE id=?`;
            params = [first_name, last_name, email || null, phone || null, department_id, parseInt(year) || null, id];
        }

        db.query(sql, params, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Student not found" });
            res.json({ success: true, message: "Student updated successfully" });
        });
    });
});

// ===== GET STUDENT INFO BY STUDENT_ID (for SmartCard) =====
router.get("/info/:student_id", verifyToken, (req, res) => {
    const student_id = decodeURIComponent(req.params.student_id);
    db.query(
        `SELECT s.*, d.name AS department, CONCAT(s.first_name,' ',COALESCE(s.last_name,'')) AS full_name
         FROM students s
         LEFT JOIN departments d ON s.department_id = d.id
         WHERE s.student_id = ?`,
        [student_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!results || results.length === 0) return res.status(404).json({ error: "Student not found" });
            res.json(results[0]);
        }
    );
});

module.exports = router;
