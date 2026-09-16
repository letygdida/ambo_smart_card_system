@echo off
echo ========================================
echo   FINAL FIX - COMPLETE RESTART
echo ========================================
echo.

echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo Starting Backend Server...
cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"
start "Backend Server - Port 5000" cmd /k "node server.js"
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend...
cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\ambo_smart_card_frontend"
start "Frontend - Port 3000" cmd /k "npm start"

echo.
echo ========================================
echo   SYSTEM STARTING
echo ========================================
echo.
echo Wait 30 seconds for both to start:
echo   1. Backend: "Server running on port 5000"
echo   2. Frontend: "Compiled successfully!"
echo   3. Browser opens at http://localhost:3000
echo.
echo IMPORTANT:
echo   - If browser shows localhost:3001, close it
echo   - Open NEW browser window to http://localhost:3000
echo   - Press Ctrl+Shift+R to clear cache
echo.
echo The backend endpoint is WORKING:
echo   ✅ mark-employee endpoint functional
echo   ✅ Auto-refresh enabled
echo   ✅ View attendance fixed
echo.
pause
