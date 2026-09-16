@echo off
echo ========================================
echo   RESTARTING BACKEND WITH FIX
echo ========================================
echo.
echo ✅ Fixed: Removed stored procedure dependency
echo    - Employee attendance control now works without sp_is_attendance_open
echo    - Auto-creates default config if missing
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting backend server...
cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"
start cmd /k "node server.js"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend...
cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\ambo_smart_card_frontend"
start cmd /k "npm start"

echo.
echo ========================================
echo   RESTART COMPLETE!
echo ========================================
echo.
echo Wait for:
echo  1. Backend: "Server running on port 5000"
echo  2. Frontend: "Compiled successfully!"
echo  3. Browser will auto-open at http://localhost:3000
echo.
echo Then refresh the Employee Attendance page (F5)
echo.
pause
