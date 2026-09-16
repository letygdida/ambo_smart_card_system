@echo off
echo ========================================
echo   PERMANENT FIX - EMPLOYEE ATTENDANCE
echo ========================================
echo.
echo This will permanently fix:
echo  1. "Unable to verify attendance control status" error
echo  2. Attendance records not displaying immediately
echo  3. Auto-refresh after marking attendance
echo.

echo Step 1: Stopping all processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Starting backend server...
cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"
start "Backend Server" cmd /k "node server.js"
timeout /t 5 /nobreak >nul

echo Step 3: Starting frontend...
cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\ambo_smart_card_frontend"
start "Frontend Dev Server" cmd /k "npm start"

echo.
echo ========================================
echo   WAITING FOR SERVERS TO START
echo ========================================
echo.
echo Please wait 30 seconds for:
echo  - Backend: "Server running on port 5000"
echo  - Frontend: "Compiled successfully!"
echo.
echo After both servers are ready:
echo  1. Browser will open automatically
echo  2. Press Ctrl+Shift+R (hard refresh) to clear cache
echo  3. If error still shows, close browser completely and reopen
echo.
echo ========================================
pause
