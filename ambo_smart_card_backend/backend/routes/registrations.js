const express = require("express");
const db = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET all pending registrations (Admin only) - UPDATED FOR USERS TABLE
router.get("/pending", verifyToken, (req, res) => {
    const sql = "SELECT * FROM users WHERE role='student' AND registration_status='pending' ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// GET all approved registrations (Admin only) - UPDATED FOR USERS TABLE
router.get("/approved", verifyToken, (req, res) => {
    const sql = "SELECT * FROM users WHERE role='student' AND registration_status='approved' ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// GET rejected registrations (Admin only) - UPDATED FOR USERS TABLE
router.get("/rejected", verifyToken, (req, res) => {
    const sql = "SELECT * FROM users WHERE role='student' AND registration_status='rejected' ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// GET single registration details - UPDATED FOR USERS TABLE
router.get("/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM users WHERE id=? AND role='student'";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Registration not found" });
        }

        res.json(results[0]);
    });
});

// APPROVE registration with university email assignment - UPDATED FOR USERS TABLE
router.post("/:id/approve", verifyToken, (req, res) => {
    const { id } = req.params;
    let { university_email } = req.body;

    // Auto-generate university email if not provided
    // Use fixed registrar email for all students
    if (!university_email) {
        university_email = "registrar@ambou.edu.et";
    }

    // Validate email format if custom email provided
    if (university_email !== "registrar@ambou.edu.et") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(university_email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }
    }
    
    // Continue with approval process
    approveWithEmail(id, university_email, res);
});

// Helper function to approve registration with email
function approveWithEmail(id, university_email, res) {
    // Get admin info from token
    const token = res.req.headers.authorization?.split(" ")[1];
    let approvedBy = "admin";
    
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = getUserFromToken(token);
            approvedBy = decoded.username || decoded.student_id || "admin";
        } catch (e) {
            // Use default
        }
    }

    // Skip email uniqueness check for registrar email (multiple students can use it)
    if (university_email !== "registrar@ambou.edu.et") {
        // Check if custom email is already used
        const checkEmailSql = "SELECT id FROM users WHERE university_email=? AND id!=?";
        db.query(checkEmailSql, [university_email, id], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: err.message });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: "University email already assigned to another student" });
            }

            // Continue with approval
            performApproval(id, university_email, approvedBy, res);
        });
    } else {
        // For registrar email, proceed directly
        performApproval(id, university_email, approvedBy, res);
    }
}

// Helper function to perform the actual approval
function performApproval(id, university_email, approvedBy, res) {
    // Update registration status and assign email in users table
    const updateRegSql = `UPDATE users 
        SET registration_status='approved', 
            university_email=?, 
            approved_by=?, 
            approved_at=NOW() 
        WHERE id=?`;

    db.query(updateRegSql, [university_email, approvedBy, id], (err) => {
        if (err) {
            console.error("Update error:", err);
            return res.status(500).json({ error: err.message });
        }

        // Get the registration details from users table
        const selectSql = "SELECT * FROM users WHERE id=?";
        db.query(selectSql, [id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).json({ error: "Error retrieving registration" });
            }

            const registration = results[0];

            // Generate smart card ID
            const cardId = `CARD-2026-${String(id).padStart(4, '0')}`;

            // Add student to students table (if not already exists)
            const addStudentSql = `INSERT INTO students (
                student_id, username, department, year, smart_card_id, photo, status
            ) VALUES (?, ?, ?, ?, ?, ?, 'active') 
            ON DUPLICATE KEY UPDATE 
                username=VALUES(username), 
                department=VALUES(department), 
                year=VALUES(year), 
                smart_card_id=VALUES(smart_card_id),
                photo=VALUES(photo),
                status=VALUES(status)`;

            db.query(addStudentSql, [
                registration.student_id,
                registration.full_name || registration.username,
                registration.department,
                registration.year,
                cardId,
                registration.photo
            ], (err) => {
                if (err) {
                    console.error("Student insert error:", err);
                    return res.status(500).json({ error: "Error creating student record: " + err.message });
                }

                console.log(`✅ Student approved by ${approvedBy}: ${registration.student_id} with card ${cardId}`);

                res.json({
                    message: "Registration approved successfully",
                    studentId: registration.student_id,
                    universityEmail: university_email,
                    smartCardId: cardId,
                    approvedBy: approvedBy,
                    status: "approved"
                });
            });
        });
    });
}

// REJECT registration - UPDATED FOR USERS TABLE
router.post("/:id/reject", verifyToken, adminOnly, (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    // Get admin info from token
    const token = req.headers.authorization?.split(" ")[1];
    let rejectedBy = "admin";
    
    if (token) {
        try {
            const jwt = require('jsonwebtoken');
            const decoded = getUserFromToken(token);
            rejectedBy = decoded.username || decoded.student_id || "admin";
        } catch (e) {
            // Use default
        }
    }

    const sql = `UPDATE users 
        SET registration_status='rejected', 
            rejected_by=?, 
            rejected_at=NOW() 
        WHERE id=?`;

    db.query(sql, [rejectedBy, id], (err) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        console.log(`✅ Registration rejected by ${rejectedBy} for student ID: ${id}`);

        res.json({
            message: "Registration rejected",
            rejectedBy: rejectedBy,
            status: "rejected"
        });
    });
});

// GET registration statistics - UPDATED FOR USERS TABLE
router.get("/stats/overview", verifyToken, (req, res) => {
    const sql = `
        SELECT
            SUM(CASE WHEN role='student' AND registration_status='pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN role='student' AND registration_status='approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN role='student' AND registration_status='rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN role='student' THEN 1 ELSE 0 END) as total
        FROM users
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json(results[0]);
    });
});

// ACTIVATE student card - NEW
router.post("/:id/activate-card", verifyToken, (req, res) => {
    const { id } = req.params;

    const sql = "UPDATE users SET card_status='active' WHERE id=? AND role='student'";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({
            message: "Card activated successfully",
            status: "active"
        });
    });
});

// BLOCK student card - NEW
router.post("/:id/block-card", verifyToken, (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const sql = "UPDATE users SET card_status='blocked' WHERE id=? AND role='student'";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({
            message: "Card blocked successfully",
            status: "blocked",
            reason: reason || "No reason provided"
        });
    });
});

// REQUEST SMART CARD (Student endpoint)
router.post("/request-card", verifyToken, (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const config = require("../config");
        const decoded = require('jsonwebtoken').verify(token, config.JWT_SECRET);
        const studentId = decoded.student_id;

        // Check if student is approved
        const checkSql = "SELECT registration_status, card_request_status FROM users WHERE student_id=? AND role='student'";
        
        db.query(checkSql, [studentId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Student not found" });
            }

            const student = results[0];

            if (student.registration_status !== 'approved') {
                return res.status(400).json({ error: "Registration must be approved first" });
            }

            if (student.card_request_status === 'pending') {
                return res.status(400).json({ error: "Card request already pending" });
            }

            if (student.card_request_status === 'approved') {
                return res.status(400).json({ error: "Card already approved" });
            }

            // Create card request
            const updateSql = "UPDATE users SET card_request_status='pending', card_requested_at=NOW() WHERE student_id=?";
            
            db.query(updateSql, [studentId], (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                res.json({
                    message: "Smart card request submitted successfully. Waiting for admin approval.",
                    status: "pending"
                });
            });
        });
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
});

// REQUEST CARD (Admin endpoint - on behalf of student)
router.post("/:id/request-card-admin", verifyToken, (req, res) => {
    const { id } = req.params;

    // Check if student is approved
    const checkSql = "SELECT registration_status, card_request_status FROM users WHERE id=? AND role='student'";
    
    db.query(checkSql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const student = results[0];

        if (student.registration_status !== 'approved') {
            return res.status(400).json({ error: "Registration must be approved first" });
        }

        if (student.card_request_status === 'pending') {
            return res.status(400).json({ error: "Card request already pending" });
        }

        if (student.card_request_status === 'approved') {
            return res.status(400).json({ error: "Card already approved" });
        }

        // Create card request
        const updateSql = "UPDATE users SET card_request_status='pending', card_requested_at=NOW() WHERE id=?";
        
        db.query(updateSql, [id], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: "Card generation request submitted successfully",
                status: "pending"
            });
        });
    });
});

// GET CARD REQUESTS (Admin endpoint)
router.get("/card-requests/:status", verifyToken, (req, res) => {
    const { status } = req.params;
    const sql = `SELECT * FROM users 
                 WHERE role='student' 
                 AND card_request_status=? 
                 ORDER BY card_requested_at DESC`;

    db.query(sql, [status], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// APPROVE CARD REQUEST (Admin endpoint)
router.post("/:id/approve-card-request", verifyToken, (req, res) => {
    const { id } = req.params;

    const sql = "UPDATE users SET card_request_status='approved' WHERE id=? AND role='student'";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({
            message: "Card request approved successfully",
            status: "approved"
        });
    });
});

// REJECT CARD REQUEST (Admin endpoint)
router.post("/:id/reject-card-request", verifyToken, (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const sql = "UPDATE users SET card_request_status='rejected' WHERE id=? AND role='student'";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json({
            message: "Card request rejected",
            status: "rejected",
            reason: reason || "No reason provided"
        });
    });
});

module.exports = router;
