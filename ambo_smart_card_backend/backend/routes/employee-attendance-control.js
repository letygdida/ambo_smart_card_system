const express = require("express");
const router = express.Router();
const db = require("../db");
const attendanceScheduler = require("../services/attendance-scheduler");

// =====================================================
// UTILITY: Check if user is admin/controller
// =====================================================
const isAdmin = (req, res, next) => {
    // Get user from token (assuming auth middleware sets req.user)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Invalid token format" });
    }

    const jwt = require("jsonwebtoken");
    try {
        const decoded = jwt.verify(token, "smartcard_secret");
        req.user = decoded;

        // Check if user is admin or staff
        if (decoded.role !== "admin" && decoded.role !== "staff") {
            return res.status(403).json({ error: "Access denied. Admin/Staff only." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// =====================================================
// GET /api/employee-attendance-control/status
// Get current attendance control status for all types
// =====================================================
router.get("/status", (req, res) => {
    console.log("GET /status - Fetching attendance control status");

    const query = `
        SELECT 
            id,
            control_mode,
            attendance_type,
            is_open,
            auto_start_time,
            auto_end_time,
            active_days,
            is_active,
            description,
            updated_by,
            updated_at
        FROM employee_attendance_control
        WHERE is_active = TRUE
        ORDER BY 
            FIELD(attendance_type, 'check-in', 'check-out', 'break-start', 'break-end')
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching control status:", err);
            return res.status(500).json({ error: "Database error", details: err.message });
        }

        // For each control, check if it's currently open (considering automatic mode)
        const statusPromises = results.map(control => {
            return new Promise((resolve) => {
                // Call stored procedure to check if open
                db.query(
                    "CALL sp_is_attendance_open(?, @is_open, @mode, @message)",
                    [control.attendance_type],
                    (err) => {
                        if (err) {
                            console.error("Error calling stored procedure:", err);
                            resolve({
                                ...control,
                                current_status: 'closed',
                                status_message: 'Error checking status'
                            });
                            return;
                        }

                        // Get output variables
                        db.query("SELECT @is_open as is_open, @mode as mode, @message as message", (err, output) => {
                            if (err || !output || output.length === 0) {
                                resolve({
                                    ...control,
                                    current_status: 'closed',
                                    status_message: 'Error reading status'
                                });
                                return;
                            }

                            const isOpen = output[0].is_open === 1;
                            resolve({
                                ...control,
                                current_status: isOpen ? 'open' : 'closed',
                                status_message: output[0].message
                            });
                        });
                    }
                );
            });
        });

        Promise.all(statusPromises).then(enrichedResults => {
            res.json({
                success: true,
                controls: enrichedResults,
                server_time: new Date().toISOString(),
                server_date: new Date().toISOString().split('T')[0],
                server_day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
            });
        });
    });
});

// =====================================================
// GET /api/employee-attendance-control/status/:type
// Get status for specific attendance type
// =====================================================
router.get("/status/:type", (req, res) => {
    const attendanceType = req.params.type;
    console.log(`GET /status/${attendanceType} - Fetching specific control status`);

    // Validate attendance type
    const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
    if (!validTypes.includes(attendanceType)) {
        return res.status(400).json({ error: "Invalid attendance type" });
    }

    const query = `
        SELECT 
            id,
            control_mode,
            attendance_type,
            is_open,
            auto_start_time,
            auto_end_time,
            active_days,
            is_active,
            description,
            updated_by,
            updated_at
        FROM employee_attendance_control
        WHERE attendance_type = ? AND is_active = TRUE
        LIMIT 1
    `;

    db.query(query, [attendanceType], (err, results) => {
        if (err) {
            console.error("Error fetching control status:", err);
            return res.status(500).json({ error: "Database error", details: err.message });
        }

        if (results.length === 0) {
            console.log(`No control configuration found for ${attendanceType}, creating default...`);
            
            // Create default configuration
            db.query(
                `INSERT INTO employee_attendance_control 
                 (attendance_type, control_mode, is_open, auto_start_time, auto_end_time, active_days, is_active, description, created_at, updated_at) 
                 VALUES (?, 'manual', 1, '08:00:00', '17:00:00', 'Monday,Tuesday,Wednesday,Thursday,Friday', TRUE, ?, NOW(), NOW())`,
                [attendanceType, `${attendanceType} control`],
                (insertErr) => {
                    if (insertErr) {
                        console.error("Error creating default config:", insertErr);
                        return res.status(500).json({ error: "Configuration error" });
                    }
                    
                    // Return default config
                    return res.json({
                        success: true,
                        control: {
                            control_mode: 'manual',
                            attendance_type: attendanceType,
                            is_open: 1,
                            auto_start_time: '08:00:00',
                            auto_end_time: '17:00:00',
                            active_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
                            is_active: true,
                            current_status: 'open',
                            status_message: 'Attendance is manually open'
                        },
                        server_time: new Date().toISOString(),
                        server_date: new Date().toISOString().split('T')[0],
                        server_day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
                    });
                }
            );
            return;
        }

        const control = results[0];
        
        // Simple status check without stored procedure
        const isOpen = control.is_open === 1;
        const statusMessage = isOpen 
            ? `Attendance is ${control.control_mode === 'manual' ? 'manually' : 'automatically'} open`
            : 'Attendance is closed';

        res.json({
            success: true,
            control: {
                ...control,
                current_status: isOpen ? 'open' : 'closed',
                status_message: statusMessage
            },
            server_time: new Date().toISOString(),
            server_date: new Date().toISOString().split('T')[0],
            server_day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        });
    });
});

// =====================================================
// POST /api/employee-attendance-control/manual/open
// Manually open attendance (Manual Mode)
// =====================================================
router.post("/manual/open", isAdmin, (req, res) => {
    const { attendance_type } = req.body;
    const username = req.user.username || 'admin';

    console.log(`POST /manual/open - Opening ${attendance_type} by ${username}`);

    // Validate
    const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
    if (!attendance_type || !validTypes.includes(attendance_type)) {
        return res.status(400).json({ error: "Valid attendance_type required (check-in, check-out, break-start, break-end)" });
    }

    // Check if control exists and is in manual mode
    db.query(
        "SELECT id, control_mode, is_open FROM employee_attendance_control WHERE attendance_type = ? AND is_active = TRUE",
        [attendance_type],
        (err, results) => {
            if (err) {
                console.error("Error checking control:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Control configuration not found" });
            }

            const control = results[0];

            if (control.control_mode !== 'manual') {
                return res.status(400).json({ 
                    error: "Cannot manually open/close when in automatic mode",
                    current_mode: control.control_mode
                });
            }

            if (control.is_open) {
                return res.status(400).json({ error: "Attendance is already open" });
            }

            // Update to open
            db.query(
                "UPDATE employee_attendance_control SET is_open = TRUE, updated_by = ?, updated_at = NOW() WHERE id = ?",
                [username, control.id],
                (err) => {
                    if (err) {
                        console.error("Error opening attendance:", err);
                        return res.status(500).json({ error: "Failed to open attendance" });
                    }

                    // Log the action
                    db.query(
                        `INSERT INTO employee_attendance_control_logs 
                        (control_id, action_type, attendance_type, performed_by, old_status, new_status, notes, ip_address)
                        VALUES (?, 'opened', ?, ?, 'closed', 'open', 'Manually opened by controller', ?)`,
                        [control.id, attendance_type, username, req.ip],
                        (err) => {
                            if (err) {
                                console.error("Error logging action:", err);
                            }

                            res.json({
                                success: true,
                                message: `${attendance_type} attendance opened successfully`,
                                attendance_type,
                                is_open: true,
                                opened_by: username,
                                opened_at: new Date().toISOString()
                            });
                        }
                    );
                }
            );
        }
    );
});

// =====================================================
// POST /api/employee-attendance-control/manual/close
// Manually close attendance (Manual Mode)
// =====================================================
router.post("/manual/close", isAdmin, (req, res) => {
    const { attendance_type } = req.body;
    const username = req.user.username || 'admin';

    console.log(`POST /manual/close - Closing ${attendance_type} by ${username}`);

    // Validate
    const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
    if (!attendance_type || !validTypes.includes(attendance_type)) {
        return res.status(400).json({ error: "Valid attendance_type required" });
    }

    // Check if control exists and is in manual mode
    db.query(
        "SELECT id, control_mode, is_open FROM employee_attendance_control WHERE attendance_type = ? AND is_active = TRUE",
        [attendance_type],
        (err, results) => {
            if (err) {
                console.error("Error checking control:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Control configuration not found" });
            }

            const control = results[0];

            if (control.control_mode !== 'manual') {
                return res.status(400).json({ 
                    error: "Cannot manually open/close when in automatic mode",
                    current_mode: control.control_mode
                });
            }

            if (!control.is_open) {
                return res.status(400).json({ error: "Attendance is already closed" });
            }

            // Update to closed
            db.query(
                "UPDATE employee_attendance_control SET is_open = FALSE, updated_by = ?, updated_at = NOW() WHERE id = ?",
                [username, control.id],
                (err) => {
                    if (err) {
                        console.error("Error closing attendance:", err);
                        return res.status(500).json({ error: "Failed to close attendance" });
                    }

                    // Log the action
                    db.query(
                        `INSERT INTO employee_attendance_control_logs 
                        (control_id, action_type, attendance_type, performed_by, old_status, new_status, notes, ip_address)
                        VALUES (?, 'closed', ?, ?, 'open', 'closed', 'Manually closed by controller', ?)`,
                        [control.id, attendance_type, username, req.ip],
                        (err) => {
                            if (err) {
                                console.error("Error logging action:", err);
                            }

                            res.json({
                                success: true,
                                message: `${attendance_type} attendance closed successfully`,
                                attendance_type,
                                is_open: false,
                                closed_by: username,
                                closed_at: new Date().toISOString()
                            });
                        }
                    );
                }
            );
        }
    );
});

// =====================================================
// PUT /api/employee-attendance-control/configure
// Update attendance control configuration
// =====================================================
router.put("/configure", isAdmin, (req, res) => {
    const { 
        attendance_type, 
        control_mode, 
        auto_start_time, 
        auto_end_time, 
        active_days,
        description 
    } = req.body;
    const username = req.user.username || 'admin';

    console.log(`PUT /configure - Updating ${attendance_type} config by ${username}`);

    // Validate
    const validTypes = ['check-in', 'check-out', 'break-start', 'break-end'];
    const validModes = ['manual', 'automatic'];

    if (!attendance_type || !validTypes.includes(attendance_type)) {
        return res.status(400).json({ error: "Valid attendance_type required" });
    }

    if (!control_mode || !validModes.includes(control_mode)) {
        return res.status(400).json({ error: "Valid control_mode required (manual or automatic)" });
    }

    // If automatic mode, validate time fields
    if (control_mode === 'automatic') {
        if (!auto_start_time || !auto_end_time) {
            return res.status(400).json({ error: "auto_start_time and auto_end_time required for automatic mode" });
        }

        // Validate time format (HH:MM or HH:MM:SS)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(auto_start_time) || !timeRegex.test(auto_end_time)) {
            return res.status(400).json({ error: "Invalid time format. Use HH:MM or HH:MM:SS" });
        }
    }

    // Check if control exists
    db.query(
        "SELECT id, control_mode, is_open FROM employee_attendance_control WHERE attendance_type = ? AND is_active = TRUE",
        [attendance_type],
        (err, results) => {
            if (err) {
                console.error("Error checking control:", err);
                return res.status(500).json({ error: "Database error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: "Control configuration not found" });
            }

            const control = results[0];
            const oldMode = control.control_mode;

            // Build update query
            let updateQuery = `
                UPDATE employee_attendance_control 
                SET control_mode = ?,
                    auto_start_time = ?,
                    auto_end_time = ?,
                    active_days = ?,
                    description = ?,
                    updated_by = ?,
                    updated_at = NOW()
            `;

            // If switching to automatic mode, close manual status
            if (control_mode === 'automatic' && oldMode === 'manual') {
                updateQuery += ", is_open = FALSE";
            }

            updateQuery += " WHERE id = ?";

            const params = [
                control_mode,
                auto_start_time || null,
                auto_end_time || null,
                active_days || 'Monday,Tuesday,Wednesday,Thursday,Friday',
                description || null,
                username,
                control.id
            ];

            db.query(updateQuery, params, (err) => {
                if (err) {
                    console.error("Error updating configuration:", err);
                    return res.status(500).json({ error: "Failed to update configuration" });
                }

                // Log the action
                db.query(
                    `INSERT INTO employee_attendance_control_logs 
                    (control_id, action_type, attendance_type, performed_by, old_status, new_status, notes, ip_address)
                    VALUES (?, 'config_updated', ?, ?, ?, ?, ?, ?)`,
                    [
                        control.id, 
                        attendance_type, 
                        username, 
                        `mode: ${oldMode}`, 
                        `mode: ${control_mode}`,
                        `Configuration updated`,
                        req.ip
                    ],
                    (err) => {
                        if (err) {
                            console.error("Error logging action:", err);
                        }

                        res.json({
                            success: true,
                            message: `${attendance_type} configuration updated successfully`,
                            attendance_type,
                            control_mode,
                            auto_start_time: control_mode === 'automatic' ? auto_start_time : null,
                            auto_end_time: control_mode === 'automatic' ? auto_end_time : null,
                            active_days: control_mode === 'automatic' ? active_days : null,
                            updated_by: username,
                            updated_at: new Date().toISOString()
                        });
                    }
                );
            });
        }
    );
});

// =====================================================
// GET /api/employee-attendance-control/logs
// Get recent control action logs
// =====================================================
router.get("/logs", isAdmin, (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const attendanceType = req.query.attendance_type;

    console.log(`GET /logs - Fetching control action logs (limit: ${limit}, offset: ${offset})`);

    let query = `
        SELECT 
            l.id,
            l.action_type,
            l.attendance_type,
            l.performed_by,
            l.action_timestamp,
            l.old_status,
            l.new_status,
            l.notes,
            c.control_mode
        FROM employee_attendance_control_logs l
        LEFT JOIN employee_attendance_control c ON l.control_id = c.id
    `;

    const params = [];

    if (attendanceType) {
        query += " WHERE l.attendance_type = ?";
        params.push(attendanceType);
    }

    query += " ORDER BY l.action_timestamp DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("Error fetching logs:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            success: true,
            logs: results,
            total: results.length,
            limit,
            offset
        });
    });
});

// =====================================================
// GET /api/employee-attendance-control/today-summary
// Get today's attendance summary
// =====================================================
router.get("/today-summary", (req, res) => {
    console.log("GET /today-summary - Fetching today's attendance summary");

    const query = `
        SELECT 
            attendance_type,
            COUNT(*) as total_scans,
            COUNT(DISTINCT employee_id) as unique_employees,
            MIN(scan_timestamp) as first_scan,
            MAX(scan_timestamp) as last_scan
        FROM employee_attendance_records
        WHERE scan_date = CURDATE()
        GROUP BY attendance_type
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching summary:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({
            success: true,
            date: new Date().toISOString().split('T')[0],
            summary: results
        });
    });
});

// =====================================================
// GET /api/employee-attendance-control/scheduler/status
// Get automatic scheduler status
// =====================================================
router.get("/scheduler/status", isAdmin, (req, res) => {
    console.log("GET /scheduler/status - Fetching scheduler status");

    const status = attendanceScheduler.getStatus();
    res.json({
        success: true,
        scheduler: status
    });
});

// =====================================================
// POST /api/employee-attendance-control/scheduler/trigger
// Manually trigger scheduler check
// =====================================================
router.post("/scheduler/trigger", isAdmin, (req, res) => {
    console.log("POST /scheduler/trigger - Manually triggering scheduler check");

    try {
        attendanceScheduler.checkAndUpdateAttendanceStatus();
        res.json({
            success: true,
            message: "Scheduler check triggered manually"
        });
    } catch (error) {
        console.error("Error triggering scheduler:", error);
        res.status(500).json({
            success: false,
            error: "Failed to trigger scheduler"
        });
    }
});

module.exports = router;
