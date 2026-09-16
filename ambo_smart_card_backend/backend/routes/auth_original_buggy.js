const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const db = require("../db");

const router = express.Router();

// ORIGINAL BUGGY LOGIN - Only checks users table
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    console.log("=== ORIGINAL BUGGY LOGIN DEBUG ===");
    console.log("Login attempt for:", username);

    // Only check users table (THIS IS THE BUG - students are in student_registrations)
    const sql = "SELECT * FROM users WHERE username=?";

    db.query(sql, [username], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        console.log("Users table query results:", result.length);

        // If not found in users table, return "User not found" (BUG: doesn't check student_registrations)
        if (result.length === 0) {
            console.log("User not found in users table - returning error (BUG: should check student_registrations)");
            return res.status(401).json({
                message: "User not found"
            });
        }

        const user = result[0];

        if (password !== user.password) {
            return res.status(401).json({
                message: "Wrong password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                full_name: user.full_name || user.username,
                role: user.role
            },
            "smartcard_secret",
            {
                expiresIn: "1h"
            }
        );

        console.log("Login successful for:", user.username);
        return res.json({
            message: "Login successful",
            token: token,
            role: user.role,
            full_name: user.full_name || user.username
        });
    });
});

module.exports = router;