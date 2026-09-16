@echo off
color 0B
echo ====================================================================
echo ATTENDANCE CONTROL - DIAGNOSTIC CHECK
echo ====================================================================
echo.

set BACKEND_DIR=%~dp0ambo_smart_card_backend\backend

echo [CHECK 1] Required Files
echo ====================================================================
if exist "%BACKEND_DIR%\routes\employee-attendance-control.js" (
    echo ✓ Route file exists
) else (
    echo ❌ Route file MISSING: routes\employee-attendance-control.js
)

if exist "%BACKEND_DIR%\services\attendance-scheduler.js" (
    echo ✓ Scheduler service exists
) else (
    echo ❌ Scheduler service MISSING: services\attendance-scheduler.js
)

if exist "%BACKEND_DIR%\sql\employee_attendance_control.sql" (
    echo ✓ SQL migration file exists
) else (
    echo ❌ SQL migration MISSING: sql\employee_attendance_control.sql
)
echo.

echo [CHECK 2] MySQL Service Status
echo ====================================================================
sc query MySQL80 | find "RUNNING" >nul 2>&1
if %errorlevel%==0 (
    echo ✓ MySQL service is running
) else (
    echo ❌ MySQL service is NOT running
    echo   Run: net start MySQL80
)
echo.

echo [CHECK 3] Testing Backend API
echo ====================================================================
echo Testing: http://localhost:5000/api/employee-attendance-control/status/check-in
echo.
curl -s http://localhost:5000/api/employee-attendance-control/status/check-in >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Backend API is responding
) else (
    echo ❌ Backend is NOT running or route not registered
    echo   Action: Start backend with 'node server.js'
)
echo.

echo [CHECK 4] Database Tables
echo ====================================================================
mysql -u root -p -D ambo_smart_card -e "DESCRIBE employee_attendance_control;" >nul 2>&1
if %errorlevel%==0 (
    echo ✓ employee_attendance_control table exists
) else (
    echo ❌ Table does NOT exist
    echo   Action: Run SQL migration
    echo   mysql -u root -p ambo_smart_card ^< backend\sql\employee_attendance_control.sql
)
echo.

echo ====================================================================
echo DIAGNOSIS COMPLETE
echo ====================================================================
echo.
echo If you see ❌ errors above, fix them before using Attendance Control
echo.
pause
