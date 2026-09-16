@echo off
echo ====================================================================
echo ATTENDANCE CONTROL - COMPLETE SETUP
echo ====================================================================
echo.

cd /d "%~dp0ambo_smart_card_backend\backend"

echo Step 1: Creating database tables...
echo.

mysql -u root ambo_smart_card < sql\employee_attendance_control.sql

if %errorlevel%==0 (
    echo ✅ Database tables created successfully!
    echo.
    echo Tables created:
    echo   - employee_attendance_control
    echo   - employee_attendance_control_logs
    echo   - employee_attendance_records
    echo.
) else (
    echo ❌ Database migration failed!
    echo.
    echo Troubleshooting:
    echo 1. Make sure MySQL is running
    echo 2. Make sure database 'ambo_smart_card' exists
    echo 3. Check if you need a password: mysql -u root -p
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Verifying tables exist...
echo.

mysql -u root ambo_smart_card -e "SHOW TABLES LIKE 'employee_attendance%%';"

echo.
echo ====================================================================
echo ✅ SETUP COMPLETE!
echo ====================================================================
echo.
echo Next steps:
echo 1. Your backend is already running (keep it running)
echo 2. Go to your browser: http://localhost:3001/employee-attendance
echo 3. Click the "ATTENDANCE CONTROL" tab
echo 4. Press Ctrl+F5 to refresh
echo 5. You should now be able to configure attendance!
echo.

pause
