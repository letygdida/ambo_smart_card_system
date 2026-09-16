# Employee Attendance Time Control System - Setup & Testing Guide

## Overview
This document provides complete instructions for setting up and testing the Employee Attendance Time Control system with Manual and Automatic modes.

---

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Testing Manual Mode](#testing-manual-mode)
5. [Testing Automatic Mode](#testing-automatic-mode)
6. [Troubleshooting](#troubleshooting)
7. [Business Rules](#business-rules)

---

## 🗄️ Database Setup

### Step 1: Run Database Migration

Execute the SQL schema file to create all necessary tables and stored procedures:

```powershell
# Navigate to backend directory
cd "C:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"

# Option 1: Using MySQL command line
mysql -u root -p ambo_smart_card < sql/employee_attendance_control.sql

# Option 2: Using MySQL Workbench
# Open sql/employee_attendance_control.sql and execute it
```

### Step 2: Verify Tables Created

Check that the following tables exist:

```sql
-- Run in MySQL
USE ambo_smart_card;

SHOW TABLES LIKE '%employee_attendance%';

-- Expected tables:
-- 1. employee_attendance_control
-- 2. employee_attendance_control_logs  
-- 3. employee_attendance_records
```

### Step 3: Verify Default Configuration

```sql
-- Check default controls were inserted
SELECT * FROM employee_attendance_control;

-- Expected: 2 rows (check-in and check-out) in manual mode
```

---

## 🖥️ Backend Setup

### Step 1: Verify Dependencies

Ensure all required packages are installed:

```powershell
cd "C:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    npm install
}
```

### Step 2: Verify Files Exist

Check that these files were created:

- ✅ `backend/sql/employee_attendance_control.sql`
- ✅ `backend/services/attendance-scheduler.js`
- ✅ `backend/routes/employee-attendance-control.js`
- ✅ `backend/server.js` (updated with scheduler)

### Step 3: Start Backend Server

```powershell
cd "C:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"
node server.js
```

**Expected Output:**
```
MySQL Connected Successfully
✓ Attendance routes loaded
✓ Auth routes registered at /api/auth
✓ Employee attendance control routes registered at /api/employee-attendance-control
Server running on port 5000

=== Starting Attendance Automation ===
🚀 Starting Automatic Attendance Scheduler...
✅ Attendance scheduler started (checking every 60 seconds)
======================================
```

---

## 🎨 Frontend Setup

### Step 1: Verify Frontend Files

Check that these files were created:

- ✅ `ambo_smart_card_frontend/src/components/EmployeeAttendanceControl.js`
- ✅ `ambo_smart_card_frontend/src/components/EmployeeAttendanceControl.css`
- ✅ `ambo_smart_card_frontend/src/App.js` (updated with route)
- ✅ `ambo_smart_card_frontend/src/components/Layout.js` (updated with menu)

### Step 2: Install Dependencies (if needed)

```powershell
cd "C:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\ambo_smart_card_frontend"

npm install
```

### Step 3: Start Frontend Development Server

```powershell
cd "C:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\ambo_smart_card_frontend"
npm start
```

**Expected Output:**
```
Compiled successfully!
Local:            http://localhost:3001
```

---

## 🧪 Testing Manual Mode

### Test 1: Login as Admin

1. Open browser: `http://localhost:3001/login`
2. Login with admin credentials
3. Navigate to **"Attendance Control"** from sidebar menu

### Test 2: View Control Status

**Expected Display:**
- ✅ Check-In card showing **🔴 CLOSED** (default)
- ✅ Check-Out card showing **🔴 CLOSED** (default)
- ✅ Control Mode: **👤 Manual**
- ✅ Server time and date displayed
- ✅ Today's attendance summary (0 employees initially)

### Test 3: Manually Open Check-In

1. On Check-In card, click **"Open Attendance"** button
2. **Expected Result:**
   - ✅ Status changes to **🟢 OPEN**
   - ✅ Success message: "check-in attendance opened successfully"
   - ✅ Open button becomes disabled
   - ✅ Close button becomes enabled

3. Check backend console logs:
   ```
   POST /manual/open - Opening check-in by admin
   ✅ check-in attendance opened successfully
   ```

### Test 4: Test Attendance Marking When OPEN

1. Navigate to **"Employee Attendance"** page
2. **Expected Display:**
   - ✅ Status banner shows **🟢 OPEN** for Check-In
   - ✅ Attendance type selector shows "Check-In"

3. Enter an employee ID (e.g., `AU-EMP-2026-0001`)
4. Click **"Mark Attendance"**
5. **Expected Result:**
   - ✅ Success message: "Employee check-in recorded successfully"
   - ✅ Employee details displayed
   - ✅ Attendance saved to `employee_attendance_records` table

6. Verify in database:
   ```sql
   SELECT * FROM employee_attendance_records 
   WHERE scan_date = CURDATE() 
   ORDER BY scan_timestamp DESC LIMIT 5;
   ```

### Test 5: Manually Close Check-In

1. Go back to **"Attendance Control"** page
2. On Check-In card, click **"Close Attendance"** button
3. **Expected Result:**
   - ✅ Status changes to **🔴 CLOSED**
   - ✅ Success message: "check-in attendance closed successfully"
   - ✅ Close button becomes disabled
   - ✅ Open button becomes enabled

### Test 6: Test Attendance Rejection When CLOSED

1. Navigate to **"Employee Attendance"** page
2. **Expected Display:**
   - ✅ Status banner shows **🔴 CLOSED**
   - ✅ Warning alert: "Attendance is currently CLOSED"

3. Try to enter an employee ID and mark attendance
4. **Expected Result:**
   - ❌ Error message: "Employee check-in attendance is currently CLOSED"
   - ❌ HTTP 403 response
   - ❌ Attendance NOT saved to database

5. Check backend console:
   ```
   Attendance control status: { is_open: false, message: 'Attendance is manually closed' }
   ❌ Rejecting scan - attendance closed
   ```

### Test 7: View Action Logs

1. On **"Attendance Control"** page, click **"View Logs"** button
2. **Expected Display:**
   - ✅ Modal opens showing action history
   - ✅ Log entries for "opened" and "closed" actions
   - ✅ Performed by: admin
   - ✅ Timestamps accurate
   - ✅ Status changes recorded (closed → open, open → closed)

---

## ⏰ Testing Automatic Mode

### Test 8: Configure Automatic Schedule

1. On **"Attendance Control"** page, find Check-In card
2. Click **"Configure"** button
3. **Configuration Form:**
   - Change **Control Mode** to: `Automatic`
   - Set **Start Time**: `08:00`
   - Set **End Time**: `15:10`
   - Set **Active Days**: `Monday,Tuesday,Wednesday,Thursday,Friday`
   - Click **"Save Configuration"**

4. **Expected Result:**
   - ✅ Success message: "check-in configuration updated successfully"
   - ✅ Card now shows **⏰ Automatic** mode
   - ✅ Time window displayed: `08:00 - 15:10`
   - ✅ Active days shown

### Test 9: Test Automatic Opening (Within Time Window)

**Prerequisite:** Current time must be between 08:00 and 15:10 on a weekday.

**Method 1 - Wait for Scheduler:**
1. Wait up to 60 seconds for automatic scheduler to run
2. Watch backend console for:
   ```
   🟢 AUTO-OPEN: check-in - Automatic open at HH:MM:SS
   ✅ check-in automatically opened
   ```

3. Refresh frontend **"Attendance Control"** page
4. **Expected Result:**
   - ✅ Check-In status shows **🟢 OPEN**
   - ✅ Status message: "Attendance automatically open (08:00 - 15:10)"

**Method 2 - Manual Trigger (Testing Only):**
```powershell
# Call scheduler trigger endpoint
curl -X POST http://localhost:5000/api/employee-attendance-control/scheduler/trigger `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json"
```

### Test 10: Test Automatic Closing (Outside Time Window)

**Prerequisite:** Current time must be OUTSIDE 08:00-15:10 or not an active day.

1. Wait for scheduler to run (up to 60 seconds)
2. Watch backend console for:
   ```
   🔴 AUTO-CLOSE: check-in - Automatic close at HH:MM:SS
   ✅ check-in automatically closed
   ```

3. Refresh frontend
4. **Expected Result:**
   - ✅ Check-In status shows **🔴 CLOSED**
   - ✅ Status message explains why (e.g., "Outside attendance window" or "Not an active day")

### Test 11: Test Time Window Crossing Midnight

**Example:** Check-Out from 23:30 to 00:30

1. Configure Check-Out:
   - Control Mode: `Automatic`
   - Start Time: `23:30`
   - End Time: `00:30`
   - Active Days: `Monday,Tuesday,Wednesday,Thursday,Friday`

2. **Test at 23:45:**
   - Expected: **🟢 OPEN** (within window)

3. **Test at 00:15:**
   - Expected: **🟢 OPEN** (crosses midnight, still within)

4. **Test at 01:00:**
   - Expected: **🔴 CLOSED** (past end time)

### Test 12: Test Weekend/Inactive Day Handling

1. Configure Check-In with Active Days: `Monday,Tuesday,Wednesday,Thursday,Friday`
2. On Saturday or Sunday, check status
3. **Expected Result:**
   - ✅ Status: **🔴 CLOSED**
   - ✅ Message: "Attendance not scheduled for Saturday" (or Sunday)

---

## 🔍 Troubleshooting

### Issue: Backend won't start

**Error:** `Cannot find module './services/attendance-scheduler'`

**Solution:**
```powershell
# Verify file exists
Test-Path "backend/services/attendance-scheduler.js"

# If missing, re-create it from the implementation
```

### Issue: Scheduler not running

**Symptoms:** No automatic open/close happening

**Diagnosis:**
```powershell
# Check backend console for scheduler startup message
# Should see: "🚀 Starting Automatic Attendance Scheduler..."
```

**Solution:**
1. Restart backend server
2. Verify scheduler is started in server.js
3. Check for errors in console

### Issue: Frontend route not found (404)

**Error:** Cannot GET /employee-attendance-control

**Solution:**
1. Verify route added to App.js
2. Verify component imported correctly
3. Restart frontend dev server: `npm start`

### Issue: Status not updating in real-time

**Solution:**
1. Check browser console for API errors
2. Verify backend is running on port 5000
3. Check CORS configuration
4. Hard refresh browser (Ctrl+F5)

### Issue: Attendance marking fails with 403

**Expected:** This is correct behavior when attendance is CLOSED

**Verify:**
1. Check attendance control status
2. Ensure attendance is OPEN before marking
3. Review backend logs for validation details

### Issue: Database connection failed

**Error:** `MySQL connection refused`

**Solution:**
```powershell
# Check MySQL is running
Get-Service MySQL*

# If stopped, start it
Start-Service MySQL80  # Adjust service name
```

### Issue: SQL file execution errors

**Error:** `Stored procedure already exists`

**Solution:**
```sql
-- Drop existing procedures first
DROP PROCEDURE IF EXISTS sp_is_attendance_open;

-- Then re-run the SQL file
```

---

## 📜 Business Rules Reference

### Attendance Control Rules

1. **Employees can ONLY mark attendance when status is OPEN**
   - Manual Mode: Admin controls open/close
   - Automatic Mode: System controls based on schedule

2. **Validation happens on BACKEND (not just frontend)**
   - Frontend check: Quick feedback to user
   - Backend check: Authoritative validation
   - Stored procedure: `sp_is_attendance_open`

3. **Duplicate Prevention**
   - One check-in per employee per day per type
   - Database enforces uniqueness

4. **Audit Trail**
   - All manual open/close actions logged
   - All automatic open/close actions logged
   - Includes: who, when, what, old status, new status

5. **Time Window Logic**
   - Normal: Start < End (e.g., 08:00 - 15:10)
   - Midnight crossing: Start > End (e.g., 23:30 - 00:30)
   - Active days: Comma-separated day names

6. **Scheduler Behavior**
   - Runs every 60 seconds
   - Checks all automatic controls
   - Only modifies status when needed (prevents spam)

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Database migration executed successfully
- [ ] All tables created and verified
- [ ] Default configurations inserted
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables configured (if any)

### Deployment Steps

1. **Database:**
   ```sql
   -- Production database
   mysql -u production_user -p production_db < sql/employee_attendance_control.sql
   ```

2. **Backend:**
   ```powershell
   # Build/prepare backend
   cd backend
   npm install --production
   
   # Start with process manager (PM2)
   pm2 start server.js --name "ambo-backend"
   ```

3. **Frontend:**
   ```powershell
   # Build frontend
   cd ambo_smart_card_frontend
   npm run build
   
   # Deploy build folder to web server
   ```

### Post-Deployment Verification

- [ ] Backend server running and accessible
- [ ] Scheduler started successfully
- [ ] Frontend accessible at production URL
- [ ] Database connection successful
- [ ] Test attendance control status API
- [ ] Test manual open/close
- [ ] Test automatic scheduling
- [ ] Test attendance marking with controls
- [ ] Verify action logs being created

---

## 📊 Monitoring

### Backend Console Monitoring

**Look for these log messages:**

✅ **Startup:**
```
MySQL Connected Successfully
✅ Attendance scheduler started (checking every 60 seconds)
Server running on port 5000
```

✅ **Automatic Actions:**
```
🟢 AUTO-OPEN: check-in - Automatic open at 08:00:15
✅ check-in automatically opened

🔴 AUTO-CLOSE: check-in - Automatic close at 15:10:30
✅ check-in automatically closed
```

✅ **Manual Actions:**
```
POST /manual/open - Opening check-in by admin
✅ check-in attendance opened successfully
```

❌ **Rejections:**
```
Attendance control status: { is_open: false }
❌ Rejecting scan - attendance closed
```

### Database Monitoring

**Check recent control actions:**
```sql
SELECT * FROM v_recent_control_actions LIMIT 20;
```

**Check today's attendance:**
```sql
SELECT * FROM v_today_employee_attendance_summary;
```

**Verify scheduler is working:**
```sql
-- Should see auto_opened/auto_closed actions if in automatic mode
SELECT action_type, COUNT(*) as count
FROM employee_attendance_control_logs
WHERE DATE(action_timestamp) = CURDATE()
GROUP BY action_type;
```

---

## 🎯 Success Criteria

### Manual Mode Works When:
- ✅ Admin can open attendance manually
- ✅ Admin can close attendance manually
- ✅ Employees can mark attendance when OPEN
- ✅ Employees are rejected when CLOSED (403)
- ✅ All actions logged to database
- ✅ Status displayed in real-time on frontend

### Automatic Mode Works When:
- ✅ Attendance opens automatically at start time
- ✅ Attendance closes automatically at end time
- ✅ Respects active days configuration
- ✅ Handles midnight-crossing windows correctly
- ✅ All actions logged as performed by SYSTEM
- ✅ Manual override not possible in automatic mode

### System Integration Works When:
- ✅ Attendance module shows current status
- ✅ Attendance marking respects control status
- ✅ Backend validates on every request
- ✅ Frontend displays clear user feedback
- ✅ Real-time updates (30-60 second refresh)
- ✅ Admin can switch between modes seamlessly

---

## 📝 Final Notes

**Administrator Responsibilities:**
1. Configure attendance schedules appropriately
2. Monitor automatic scheduler logs
3. Review action logs regularly
4. Handle edge cases (holidays, special events)
5. Communicate schedule changes to employees

**System Capabilities:**
- ✅ Two modes: Manual and Automatic
- ✅ Multiple attendance types: check-in, check-out, breaks
- ✅ Flexible time windows (including midnight crossing)
- ✅ Weekday selection
- ✅ Complete audit trail
- ✅ Real-time status display
- ✅ Backend validation (security)
- ✅ Automatic scheduling

**Next Steps:**
1. Complete end-to-end testing per this guide
2. Train administrators on both modes
3. Configure production schedules
4. Monitor first week of operation
5. Adjust schedules based on feedback

---

## 📞 Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review backend console logs
3. Check database logs in `employee_attendance_control_logs`
4. Verify all files are in place
5. Test with simple scenarios first

**System Version:** 1.0.0  
**Last Updated:** 2026-09-02  
**Author:** Kiro AI Development Team
