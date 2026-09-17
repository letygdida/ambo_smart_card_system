const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("../db");
const config = require("../config");

// Helper function to verify token and extract user info
function getUserFromToken(token) {
    if (!token) return null;
    try {
        return jwt.verify(token, config.JWT_SECRET);
    } catch (e) {
        return null;
    }
}

const router = express.Router();

// Configure multer for registration document uploads
const registrationUploadsDir = path.join(__dirname, "../uploads/registrations");
if (!fs.existsSync(registrationUploadsDir)) {
    fs.mkdirSync(registrationUploadsDir, { recursive: true });
}

const registrationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, registrationUploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const registrationUpload = multer({
    storage: registrationStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// ===== LOGIN - UNIFIED FOR ALL USERS (ADMIN, STAFF, STUDENT) =====
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    console.log("Login attempt for:", username);

    // Single query for all users in unified users table
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, result) => {
        if (err) {
            console.error("Login query error:", err.message);
            return res.status(500).json({ message: "Database error: " + err.message });
        }

        if (!result || result.length === 0) {
            console.log("User not found:", username);
            return res.status(401).json({ message: "User not found" });
        }

        const user = result[0];
        console.log("User found - Role:", user.role);

        // Verify password
        if (password !== user.password) {
            console.log("Wrong password for user:", username);
            return res.status(401).json({ message: "Wrong password" });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                student_id: user.student_id
            },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRES_IN }
        );

        console.log("Login successful for:", username, "Role:", user.role);

        return res.json({
            message: "Login successful",
            token: token,
            role: user.role,
            username: user.username,
            student_id: user.student_id
        });
    });
});

// ===== STUDENT ACCOUNT CREATION =====
router.post("/register", (req, res) => {
    console.log("Account creation request received");

    try {
        const { username, password, confirm_password } = req.body;

        // Validation
        if (!username || !password || !confirm_password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (username.trim().length < 3) {
            return res.status(400).json({ error: "Username must be at least 3 characters" });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        // Generate Student ID
        const currentYear = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        const auto_student_id = `${currentYear}-${randomNum}`;

        // Generate university email from username
        const emailPrefix = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const auto_university_email = `${emailPrefix}${auto_student_id.replace('-', '')}@ambo.edu.et`;

        console.log("New account creation:", { username, auto_student_id, auto_university_email });

        // Check if username already exists in users table
        db.query(
            "SELECT id FROM users WHERE username = ? OR university_email = ?",
            [username, auto_university_email],
            (err, results) => {
                if (err) {
                    console.error("Duplicate check error:", err.message);
                    return res.status(500).json({ error: "Database error" });
                }

                if (results && results.length > 0) {
                    return res.status(400).json({ error: "Username or email already registered" });
                }

                // Insert new student into users table
                const insertSql = `INSERT INTO users
                    (username, password, role, student_id, university_email, registration_status)
                    VALUES (?, ?, ?, ?, ?, ?)`;

                db.query(
                    insertSql,
                    [username, password, 'student', auto_student_id, auto_university_email, 'pending'],
                    (err, result) => {
                        if (err) {
                            console.error("Insert error:", err.message);
                            return res.status(500).json({ error: "Account creation failed: " + err.message });
                        }

                        console.log("Student account created:", auto_student_id);

                        res.json({
                            message: "Account created successfully! Please log in.",
                            studentId: auto_student_id,
                            universityEmail: auto_university_email
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ error: "Registration error: " + error.message });
    }
});

// ===== STUDENT PROFILE COMPLETION =====
router.post("/complete-profile", registrationUpload.fields([
    { name: 'id_document', maxCount: 1 }
]), (req, res) => {
    console.log("Profile completion request received");

    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const decoded = getUserFromToken(token);
        const studentId = decoded.student_id;

        const {
            full_name,
            personal_email,
            phone_number,
            gender,
            date_of_birth,
            nationality,
            region,
            zone,
            woreda,
            address,
            campus,
            school,
            department,
            program,
            year,
            semester,
            section,
            emergency_contact_name,
            emergency_contact_relationship,
            emergency_contact_phone,
            emergency_contact_address
        } = req.body;

        // Validation
        if (!full_name || !phone_number || !department) {
            return res.status(400).json({ error: "Required fields are missing" });
        }

        const phoneRegex = /^[0-9]{10,}$/;
        if (!phoneRegex.test(phone_number.replace(/\D/g, ''))) {
            return res.status(400).json({ error: "Invalid phone number" });
        }

        const idDocument = req.files && req.files['id_document'] ? req.files['id_document'][0].filename : null;

        console.log("Updating profile for student:", studentId);

        // Update user profile in users table (FIXED - using users table)
        const updateSql = `UPDATE users
            SET full_name = ?, personal_email = ?, phone_number = ?,
                gender = ?, date_of_birth = ?, nationality = ?, region = ?,
                zone = ?, woreda = ?, address = ?,
                campus = ?, school = ?, department = ?, program = ?,
                year = ?, semester = ?, section = ?,
                emergency_contact_name = ?, emergency_contact_relationship = ?,
                emergency_contact_phone = ?, emergency_contact_address = ?,
                id_document = ?, photo = ?, profile_completed = ?, registration_status = ?
            WHERE student_id = ?`;

        const values = [
            full_name, personal_email, phone_number,
            gender, date_of_birth || null, nationality, region,
            zone, woreda, address,
            campus, school, department, program,
            year || null, semester || null, section,
            emergency_contact_name, emergency_contact_relationship,
            emergency_contact_phone, emergency_contact_address,
            idDocument, idDocument, true, 'approved', studentId
        ];

        db.query(updateSql, values, (err, result) => {
            if (err) {
                console.error("Update error:", err.message);
                return res.status(500).json({ error: "Profile update failed: " + err.message });
            }

            console.log("Student profile updated:", studentId);

            res.json({
                message: "Profile completed successfully!",
                studentId: studentId
            });
        });
    } catch (error) {
        console.error("Profile completion error:", error.message);
        res.status(401).json({ error: "Invalid token or profile error" });
    }
});

// ===== CHECK IF PHONE EXISTS =====
router.post("/check-phone", (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ error: "Phone is required" });
    }

    db.query("SELECT id FROM users WHERE phone_number = ?", [phone], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ exists: results && results.length > 0 });
    });
});

// ===== GET STUDENT PROFILE STATUS =====
router.get("/profile-status", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = getUserFromToken(token);
        const studentId = decoded.student_id;

        db.query(
            "SELECT profile_completed, full_name FROM users WHERE student_id = ?",
            [studentId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ error: "Database error" });
                }

                if (!results || results.length === 0) {
                    return res.status(404).json({ error: "Student not found" });
                }

                res.json({
                    profileCompleted: results[0].profile_completed,
                    fullName: results[0].full_name
                });
            }
        );
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// ===== GET STUDENT PROFILE (Full Data) =====
console.log("Registering GET /api/auth/profile route");
router.get("/profile", (req, res) => {
    console.log("GET /profile endpoint hit!");
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = getUserFromToken(token);
        const studentId = decoded.student_id;

        db.query(
            "SELECT * FROM users WHERE student_id = ?",
            [studentId],
            (err, results) => {
                if (err) {
                    console.error("Profile query error:", err.message);
                    return res.status(500).json({ error: "Database error" });
                }

                if (!results || results.length === 0) {
                    return res.status(404).json({ error: "Student not found" });
                }

                // Don't send password to frontend
                const profile = results[0];
                delete profile.password;

                // If photo is NULL or empty, use default avatar
                if (!profile.photo || profile.photo === '') {
                    profile.photo = 'default-avatar.svg';
                }

                res.json(profile);
            }
        );
    } catch (error) {
        console.error("Token error:", error.message);
        res.status(401).json({ error: "Invalid token" });
    }
});

// ===== UPDATE STUDENT PROFILE (Edit Profile) =====
console.log("Registering PUT /api/auth/profile route");
router.put("/profile", registrationUpload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), (req, res) => {
    console.log("Profile update request received");

    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const decoded = getUserFromToken(token);
        const studentId = decoded.student_id;

        const {
            full_name,
            personal_email,
            phone_number,
            gender,
            date_of_birth,
            nationality,
            region,
            zone,
            woreda,
            address,
            campus,
            school,
            department,
            program,
            year,
            semester,
            section,
            emergency_contact_name,
            emergency_contact_relationship,
            emergency_contact_phone,
            emergency_contact_address
        } = req.body;

        // Get current profile to keep existing files if not updated
        db.query("SELECT photo, id_document FROM users WHERE student_id = ?", [studentId], (err, currentProfile) => {
            if (err) {
                console.error("Query error:", err.message);
                return res.status(500).json({ error: "Database error" });
            }

            const currentPhoto = currentProfile[0]?.photo;
            const currentIdDoc = currentProfile[0]?.id_document;

            // Use new files if uploaded, otherwise keep existing
            const photoFile = req.files && req.files['photo'] ? req.files['photo'][0].filename : currentPhoto;
            const idDocFile = req.files && req.files['id_document'] ? req.files['id_document'][0].filename : currentIdDoc;

            console.log("Updating profile for student:", studentId);
            console.log("Photo file:", photoFile);
            console.log("ID document:", idDocFile);

            // Update user profile in users table
            const updateSql = `UPDATE users
                SET full_name = ?, personal_email = ?, phone_number = ?,
                    gender = ?, date_of_birth = ?, nationality = ?, region = ?,
                    zone = ?, woreda = ?, address = ?,
                    campus = ?, school = ?, department = ?, program = ?,
                    year = ?, semester = ?, section = ?,
                    emergency_contact_name = ?, emergency_contact_relationship = ?,
                    emergency_contact_phone = ?, emergency_contact_address = ?,
                    id_document = ?, photo = ?, profile_completed = ?
                WHERE student_id = ?`;

            const values = [
                full_name, personal_email, phone_number,
                gender, date_of_birth || null, nationality, region,
                zone, woreda, address,
                campus, school, department, program,
                year || null, semester || null, section,
                emergency_contact_name, emergency_contact_relationship,
                emergency_contact_phone, emergency_contact_address,
                idDocFile, photoFile, true, studentId
            ];

            db.query(updateSql, values, (err, result) => {
                if (err) {
                    console.error("Update error:", err.message);
                    return res.status(500).json({ error: "Profile update failed: " + err.message });
                }

                console.log("Student profile updated successfully:", studentId);

                // Also update students table if student is approved
                db.query(
                    "UPDATE students SET username = ?, department = ?, year = ?, photo = ? WHERE student_id = ?",
                    [full_name, department, year, photoFile, studentId],
                    (err) => {
                        if (err) {
                            console.log("Students table update skipped (may not exist yet)");
                        }
                    }
                );

                res.json({
                    message: "Profile updated successfully!",
                    studentId: studentId,
                    photo: photoFile,
                    idDocument: idDocFile
                });
            });
        });
    } catch (error) {
        console.error("Profile update error:", error.message);
        res.status(401).json({ error: "Invalid token or update error" });
    }
});

// ===== UPLOAD/UPDATE PHOTO ONLY =====
router.post("/upload-photo", registrationUpload.single('photo'), (req, res) => {
    console.log("Photo upload request received");

    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const decoded = getUserFromToken(token);
        const studentId = decoded.student_id;

        if (!req.file) {
            return res.status(400).json({ error: "No photo file uploaded" });
        }

        const photoFilename = req.file.filename;
        console.log("Uploading photo for student:", studentId, "File:", photoFilename);

        // Update photo in users table
        db.query(
            "UPDATE users SET photo = ? WHERE student_id = ?",
            [photoFilename, studentId],
            (err, result) => {
                if (err) {
                    console.error("Photo update error:", err.message);
                    return res.status(500).json({ error: "Photo upload failed: " + err.message });
                }

                console.log("Photo updated successfully for student:", studentId);

                // Also update students table if exists
                db.query(
                    "UPDATE students SET photo = ? WHERE student_id = ?",
                    [photoFilename, studentId],
                    (err) => {
                        if (err) {
                            console.log("Students table photo update skipped (may not exist yet)");
                        }
                    }
                );

                res.json({
                    message: "Photo uploaded successfully!",
                    photo: photoFilename,
                    photoUrl: `/uploads/registrations/${photoFilename}`
                });
            }
        );
    } catch (error) {
        console.error("Photo upload error:", error.message);
        res.status(401).json({ error: "Invalid token or upload error" });
    }
});

// ===== GET STUDENT PHOTO =====
router.get("/photo/:studentId", (req, res) => {
    const { studentId } = req.params;

    db.query(
        "SELECT photo FROM users WHERE student_id = ?",
        [studentId],
        (err, results) => {
            if (err) {
                console.error("Photo query error:", err.message);
                return res.status(500).json({ error: "Database error" });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ error: "Student not found" });
            }

            const photo = results[0].photo;
            if (!photo || photo === '') {
                // Return default avatar if no photo
                return res.json({
                    photo: 'default-avatar.svg',
                    photoUrl: `/uploads/registrations/default-avatar.svg`
                });
            }

            res.json({
                photo: photo,
                photoUrl: `/uploads/registrations/${photo}`
            });
        }
    );
});

module.exports = router;
