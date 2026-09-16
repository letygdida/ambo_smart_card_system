@echo off
echo ================================================================
echo RESTARTING BACKEND WITH ATTENDANCE CONTROL SYSTEM
echo ================================================================
echo.

cd "%~dp0ambo_smart_card_backend\backend"

echo Step 1: Checking if required files exist...
if not exist "routes\employee-attendance-control.js" (
    echo ERROR: employee-attendance-control.js not found!
    pause
    exit /b 1
)

if not exist "services\attendance-scheduler.js" (
    echo ERROR: attendance-scheduler.js not found!
    pause
    exit /b 1
)

echo ✓ All required files found
echo.

echo Step 2: Starting backend server...
echo Look for this message: "Attendance scheduler started"
echo.

node server.js

pause
