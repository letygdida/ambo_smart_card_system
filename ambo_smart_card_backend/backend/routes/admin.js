const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { verifyToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

// ===== GET ADMIN PROFILE =====
router.get("/profile", verifyToken, adminOnly, (req, res) => {
  console.log("GET /api/admin/profile - User:", req.user.username);

  try {
    const userId = req.user.id;

    db.query(
      "SELECT id, username, full_name, personal_email, phone_number, department, role FROM users WHERE id = ? AND role = 'admin'",
      [userId],
      (err, results) => {
        if (err) {
          console.error("Profile query error:", err.message);
          return res.status(500).json({ error: "Database error: " + err.message });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({ error: "Admin profile not found" });
        }

        const admin = results[0];
        console.log("Admin profile retrieved:", admin.username);

        res.json({
          id: admin.id,
          username: admin.username,
          full_name: admin.full_name || "",
          email: admin.personal_email || "",
          phone_number: admin.phone_number || "",
          department: admin.department || "",
          role: admin.role
        });
      }
    );
  } catch (error) {
    console.error("Profile fetch error:", error.message);
    res.status(401).json({ error: "Invalid token or profile error" });
  }
});

// ===== UPDATE ADMIN PROFILE =====
router.put("/profile", verifyToken, adminOnly, (req, res) => {
  console.log("PUT /api/admin/profile - User:", req.user.username);

  try {
    const userId = req.user.id;
    const { full_name, email, phone, phone_number, department } = req.body;
    
    // Accept both 'phone' and 'phone_number' field names from frontend
    const phoneValue = phone || phone_number;

    // Validation
    if (!full_name || !email || !phoneValue) {
      return res.status(400).json({ error: "Required fields are missing (full_name, email, phone)" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone format (basic - at least 10 digits)
    const phoneDigits = phoneValue.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: "Phone number must be at least 10 digits" });
    }

    console.log("Updating profile for admin:", userId);

    // Check if email already exists for another user
    db.query(
      "SELECT id FROM users WHERE personal_email = ? AND id != ?",
      [email, userId],
      (err, existingUser) => {
        if (err) {
          console.error("Email check error:", err.message);
          return res.status(500).json({ error: "Database error: " + err.message });
        }

        if (existingUser && existingUser.length > 0) {
          return res.status(400).json({ error: "Email already in use by another admin" });
        }

        // Update admin profile
        const updateSql = `UPDATE users
          SET full_name = ?, personal_email = ?, phone_number = ?, department = ?
          WHERE id = ? AND role = 'admin'`;

        db.query(
          updateSql,
          [full_name, email, phoneValue, department || null, userId],
          (err, result) => {
            if (err) {
              console.error("Profile update error:", err.message);
              return res.status(500).json({ error: "Profile update failed: " + err.message });
            }

            console.log("Admin profile updated successfully:", userId);

            res.json({
              message: "Profile updated successfully!",
              profile: {
                full_name,
                email,
                phone_number: phoneValue,
                department
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Profile update error:", error.message);
    res.status(401).json({ error: "Invalid token or update error" });
  }
});

// ===== CHANGE PASSWORD =====
router.post("/change-password", verifyToken, adminOnly, (req, res) => {
  console.log("POST /api/admin/change-password - User:", req.user.username);

  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All password fields are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    console.log("Verifying current password for admin:", userId);

    // Get current password hash
    db.query(
      "SELECT password FROM users WHERE id = ? AND role = 'admin'",
      [userId],
      (err, results) => {
        if (err) {
          console.error("Password query error:", err.message);
          return res.status(500).json({ error: "Database error: " + err.message });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({ error: "Admin not found" });
        }

        const admin = results[0];
        const storedPassword = admin.password;

        // Verify current password (plain text comparison for now, can enhance with bcrypt)
        if (currentPassword !== storedPassword) {
          console.log("Incorrect current password for admin:", userId);
          return res.status(401).json({ error: "Current password is incorrect" });
        }

        console.log("Current password verified. Updating to new password for admin:", userId);

        // Update password
        const updateSql = `UPDATE users
          SET password = ?
          WHERE id = ? AND role = 'admin'`;

        db.query(
          updateSql,
          [newPassword, userId],
          (err, result) => {
            if (err) {
              console.error("Password update error:", err.message);
              return res.status(500).json({ error: "Password change failed: " + err.message });
            }

            console.log("Password changed successfully for admin:", userId);

            res.json({
              message: "Password changed successfully!"
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Password change error:", error.message);
    res.status(401).json({ error: "Invalid token or password change error" });
  }
});

// ===== GET ADMIN SETTINGS =====
router.get("/settings", verifyToken, adminOnly, (req, res) => {
  console.log("GET /api/admin/settings - User:", req.user.username);

  try {
    const userId = req.user.id;

    db.query(
      "SELECT id, email_notifications, sms_notifications, two_factor_auth, dark_mode, auto_logout, auto_logout_minutes FROM users WHERE id = ? AND role = 'admin'",
      [userId],
      (err, results) => {
        if (err) {
          console.error("Settings query error:", err.message);
          return res.status(500).json({ error: "Database error: " + err.message });
        }

        if (!results || results.length === 0) {
          return res.status(404).json({ error: "Admin settings not found" });
        }

        const settings = results[0];
        console.log("Admin settings retrieved:", settings.id);

        res.json({
          emailNotifications: settings.email_notifications || false,
          smsNotifications: settings.sms_notifications || false,
          twoFactorAuth: settings.two_factor_auth || false,
          darkMode: settings.dark_mode || false,
          autoLogout: settings.auto_logout !== false, // Default to true
          autoLogoutMinutes: settings.auto_logout_minutes || 30
        });
      }
    );
  } catch (error) {
    console.error("Settings fetch error:", error.message);
    res.status(401).json({ error: "Invalid token or settings error" });
  }
});

// ===== UPDATE ADMIN SETTINGS =====
router.put("/settings", verifyToken, adminOnly, (req, res) => {
  console.log("PUT /api/admin/settings - User:", req.user.username);

  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      smsNotifications,
      twoFactorAuth,
      darkMode,
      autoLogout,
      autoLogoutMinutes
    } = req.body;

    // Validation
    const autoLogoutMins = parseInt(autoLogoutMinutes) || 30;
    if (autoLogoutMins < 5 || autoLogoutMins > 480) {
      return res.status(400).json({ error: "Auto-logout minutes must be between 5 and 480" });
    }

    console.log("Updating settings for admin:", userId);

    const updateSql = `UPDATE users
      SET email_notifications = ?,
          sms_notifications = ?,
          two_factor_auth = ?,
          dark_mode = ?,
          auto_logout = ?,
          auto_logout_minutes = ?
      WHERE id = ? AND role = 'admin'`;

    db.query(
      updateSql,
      [
        emailNotifications ? 1 : 0,
        smsNotifications ? 1 : 0,
        twoFactorAuth ? 1 : 0,
        darkMode ? 1 : 0,
        autoLogout ? 1 : 0,
        autoLogoutMins,
        userId
      ],
      (err, result) => {
        if (err) {
          console.error("Settings update error:", err.message);
          return res.status(500).json({ error: "Settings update failed: " + err.message });
        }

        console.log("Admin settings updated successfully:", userId);

        res.json({
          message: "Settings saved successfully!",
          settings: {
            emailNotifications,
            smsNotifications,
            twoFactorAuth,
            darkMode,
            autoLogout,
            autoLogoutMinutes: autoLogoutMins
          }
        });
      }
    );
  } catch (error) {
    console.error("Settings update error:", error.message);
    res.status(401).json({ error: "Invalid token or settings error" });
  }
});

module.exports = router;
