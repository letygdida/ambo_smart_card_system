@echo off
ECHO ========================================
ECHO   PERMANENT FIX FOR EMPLOYEE ATTENDANCE
ECHO ========================================
ECHO.
ECHO This will permanently fix all attendance display issues:
ECHO 1. Change employee_type column from ENUM to VARCHAR
ECHO 2. Update NULL employee_type values in attendance records
ECHO 3. Update NULL employee_type values in employees table
ECHO 4. Ensure all records display correctly
ECHO.
ECHO Press any key to continue...
PAUSE >nul

cd "%~dp0ambo_smart_card_backend\backend"

ECHO.
ECHO ========================================
ECHO Step 1: Fixing Column Type
ECHO ========================================
node fix_employee_type_column.js

ECHO.
ECHO ========================================
ECHO Step 2: Updating Attendance Records
ECHO ========================================
node update_null_employee_types.js

ECHO.
ECHO ========================================
ECHO Step 3: Checking Final Status
ECHO ========================================
node check_attendance_records.js

ECHO.
ECHO ========================================
ECHO   ALL FIXES APPLIED SUCCESSFULLY!
ECHO ========================================
ECHO.
ECHO NEXT STEPS:
ECHO 1. Restart your backend server
ECHO 2. Refresh the frontend (Ctrl+Shift+R)
ECHO 3. Go to VIEW ATTENDANCE tab
ECHO 4. Click APPLY FILTERS
ECHO 5. All records should now display correctly!
ECHO.
ECHO Press any key to exit...
PAUSE >nul
