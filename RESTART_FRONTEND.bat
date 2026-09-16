@echo off
echo ========================================
echo   RESTARTING FRONTEND
echo ========================================
echo.
echo This will restart the React frontend with updated code
echo.

cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\ambo_smart_card_frontend"

echo Stopping any running React processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *react-scripts*" 2>nul

echo.
echo Starting React frontend...
echo.
start cmd /k "npm start"

echo.
echo ✅ Frontend restart initiated!
echo    - Wait for "Compiled successfully!" message
echo    - Browser will open automatically at http://localhost:3000
echo.
pause
