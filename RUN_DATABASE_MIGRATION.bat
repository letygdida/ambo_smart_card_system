@echo off
echo ====================================================================
echo RUNNING DATABASE MIGRATION FOR ATTENDANCE CONTROL
echo ====================================================================
echo.

cd /d "%~dp0ambo_smart_card_backend\backend"

echo Running SQL migration...
echo.

mysql -u root ambo_smart_card < sql\employee_attendance_control.sql

if %errorlevel%==0 (
    echo.
    echo ====================================================================
    echo ✅ SUCCESS! Database tables created.
    echo ====================================================================
    echo.
    echo Tables created:
    echo   - employee_attendance_control
    echo   - employee_attendance_control_logs
    echo   - employee_attendance_records
    echo.
    echo Now refresh your browser (Ctrl+F5) and try again!
    echo.
) else (
    echo.
    echo ====================================================================
    echo ❌ ERROR: Migration failed
    echo ====================================================================
    echo.
    echo Possible reasons:
    echo   - Wrong MySQL password
    echo   - MySQL not running
    echo   - Database 'ambo_smart_card' doesn't exist
    echo.
)

pause
