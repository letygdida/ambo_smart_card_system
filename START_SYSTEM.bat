@echo off
REM =====================================================
REM Ambo Smart Card System - START SCRIPT
REM Starts both Backend (Node.js) and Frontend (React)
REM =====================================================

cd /d "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)

echo =====================================================
echo Starting Ambo Smart Card System
echo =====================================================
echo.

REM Start Backend in a new window
echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && node server.js"
timeout /t 3

REM Start Frontend in a new window
echo [2/2] Starting Frontend (Port 3000)...
start "Frontend Server" cmd /k "cd ambo_smart_card_frontend && npm start"
timeout /t 5

echo.
echo =====================================================
echo System Starting...
echo =====================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Waiting for servers to start...
echo This may take 30-60 seconds on first run
echo.
timeout /t 10

REM Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo System is ready!
echo.
pause
