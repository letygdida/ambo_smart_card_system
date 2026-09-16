/**
 * Automatic Attendance Scheduler Service
 * 
 * This service runs in the background and automatically manages attendance
 * control status based on configured time windows and active days.
 * 
 * Features:
 * - Checks every minute if attendance should be automatically opened/closed
 * - Logs all automatic actions for audit trail
 * - Handles time windows that cross midnight
 * - Respects active days configuration
 */

const db = require('../db');

class AttendanceScheduler {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.CHECK_FREQUENCY_MS = 60000; // Check every 60 seconds
    }

    /**
     * Start the scheduler
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Attendance scheduler is already running');
            return;
        }

        console.log('🚀 Starting Automatic Attendance Scheduler...');
        this.isRunning = true;

        // Run immediately on start
        this.checkAndUpdateAttendanceStatus();

        // Then run at regular intervals
        this.checkInterval = setInterval(() => {
            this.checkAndUpdateAttendanceStatus();
        }, this.CHECK_FREQUENCY_MS);

        console.log(`✅ Attendance scheduler started (checking every ${this.CHECK_FREQUENCY_MS / 1000} seconds)`);
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Attendance scheduler is not running');
            return;
        }

        console.log('🛑 Stopping Automatic Attendance Scheduler...');
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.isRunning = false;
        console.log('✅ Attendance scheduler stopped');
    }

    /**
     * Main function to check and update attendance status
     */
    async checkAndUpdateAttendanceStatus() {
        try {
            // Get all active automatic controls
            const query = `
                SELECT 
                    id,
                    attendance_type,
                    control_mode,
                    is_open,
                    auto_start_time,
                    auto_end_time,
                    active_days
                FROM employee_attendance_control
                WHERE is_active = TRUE AND control_mode = 'automatic'
            `;

            db.query(query, async (err, controls) => {
                if (err) {
                    console.error('❌ Error fetching automatic controls:', err);
                    return;
                }

                if (!controls || controls.length === 0) {
                    return; // No automatic controls configured
                }

                const now = new Date();
                const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
                const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

                // Process each control
                for (const control of controls) {
                    await this.processControl(control, currentTime, currentDay);
                }
            });
        } catch (error) {
            console.error('❌ Error in attendance scheduler:', error);
        }
    }

    /**
     * Process a single control configuration
     */
    async processControl(control, currentTime, currentDay) {
        return new Promise((resolve) => {
            const {
                id,
                attendance_type,
                is_open,
                auto_start_time,
                auto_end_time,
                active_days
            } = control;

            // Check if today is an active day
            const activeDaysList = active_days ? active_days.split(',').map(d => d.trim()) : [];
            const isActiveDay = activeDaysList.includes(currentDay);

            if (!isActiveDay) {
                // Not an active day - ensure it's closed
                if (is_open) {
                    this.closeAttendance(id, attendance_type, 'Not an active day');
                }
                resolve();
                return;
            }

            // Check if current time is within the window
            const shouldBeOpen = this.isWithinTimeWindow(currentTime, auto_start_time, auto_end_time);

            // Update status if needed
            if (shouldBeOpen && !is_open) {
                // Should be open but currently closed - OPEN IT
                this.openAttendance(id, attendance_type, `Automatic open at ${currentTime}`);
            } else if (!shouldBeOpen && is_open) {
                // Should be closed but currently open - CLOSE IT
                this.closeAttendance(id, attendance_type, `Automatic close at ${currentTime}`);
            }

            resolve();
        });
    }

    /**
     * Check if current time is within the configured time window
     * Handles windows that cross midnight (e.g., 23:30 - 00:30)
     */
    isWithinTimeWindow(currentTime, startTime, endTime) {
        if (!startTime || !endTime) {
            return false;
        }

        const current = this.timeToMinutes(currentTime);
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);

        if (end < start) {
            // Time window crosses midnight
            // e.g., 23:30 (start) to 00:30 (end)
            // Should be open if: current >= 23:30 OR current <= 00:30
            return current >= start || current <= end;
        } else {
            // Normal time window (same day)
            // e.g., 08:00 (start) to 15:10 (end)
            // Should be open if: current >= 08:00 AND current <= 15:10
            return current >= start && current <= end;
        }
    }

    /**
     * Convert time string (HH:MM:SS or HH:MM) to minutes since midnight
     */
    timeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    }

    /**
     * Automatically open attendance
     */
    openAttendance(controlId, attendanceType, reason) {
        console.log(`🟢 AUTO-OPEN: ${attendanceType} - ${reason}`);

        // Update control status
        db.query(
            'UPDATE employee_attendance_control SET is_open = TRUE, updated_at = NOW() WHERE id = ?',
            [controlId],
            (err) => {
                if (err) {
                    console.error(`❌ Failed to auto-open ${attendanceType}:`, err);
                    return;
                }

                // Log the action
                db.query(
                    `INSERT INTO employee_attendance_control_logs 
                    (control_id, action_type, attendance_type, performed_by, old_status, new_status, notes)
                    VALUES (?, 'auto_opened', ?, 'SYSTEM', 'closed', 'open', ?)`,
                    [controlId, attendanceType, reason],
                    (logErr) => {
                        if (logErr) {
                            console.error('❌ Failed to log auto-open action:', logErr);
                        }
                    }
                );

                console.log(`✅ ${attendanceType} automatically opened`);
            }
        );
    }

    /**
     * Automatically close attendance
     */
    closeAttendance(controlId, attendanceType, reason) {
        console.log(`🔴 AUTO-CLOSE: ${attendanceType} - ${reason}`);

        // Update control status
        db.query(
            'UPDATE employee_attendance_control SET is_open = FALSE, updated_at = NOW() WHERE id = ?',
            [controlId],
            (err) => {
                if (err) {
                    console.error(`❌ Failed to auto-close ${attendanceType}:`, err);
                    return;
                }

                // Log the action
                db.query(
                    `INSERT INTO employee_attendance_control_logs 
                    (control_id, action_type, attendance_type, performed_by, old_status, new_status, notes)
                    VALUES (?, 'auto_closed', ?, 'SYSTEM', 'open', 'closed', ?)`,
                    [controlId, attendanceType, reason],
                    (logErr) => {
                        if (logErr) {
                            console.error('❌ Failed to log auto-close action:', logErr);
                        }
                    }
                );

                console.log(`✅ ${attendanceType} automatically closed`);
            }
        );
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            checkFrequencySeconds: this.CHECK_FREQUENCY_MS / 1000,
            lastCheck: new Date().toISOString()
        };
    }
}

// Create singleton instance
const scheduler = new AttendanceScheduler();

module.exports = scheduler;
