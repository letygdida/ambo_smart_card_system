# =====================================================
# Ambo Smart Card System - PowerShell Startup Script
# Starts both Backend (Node.js) and Frontend (React)
# =====================================================

# Set location
Set-Location "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend"

Write-Host "====================================================="
Write-Host "Starting Ambo Smart Card System"
Write-Host "====================================================="
Write-Host ""

# Check Node.js
Write-Host "[CHECK] Verifying Node.js installation..."
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion"
} catch {
    Write-Host "✗ ERROR: Node.js not found"
    Write-Host "Please install from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit
}

# Check npm
Write-Host "[CHECK] Verifying npm installation..."
try {
    $npmVersion = & npm --version 2>&1
    Write-Host "✓ npm: $npmVersion"
} catch {
    Write-Host "✗ ERROR: npm not found"
    Read-Host "Press Enter to exit"
    exit
}

Write-Host ""

# Start Backend
Write-Host "[1/2] Starting Backend Server (Port 5000)..."
$backendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd backend && node server.js" -PassThru -WindowStyle Normal
Write-Host "Backend PID: $($backendJob.Id)"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend (Port 3000/3001)..."
$frontendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd ambo_smart_card_frontend && npm start" -PassThru -WindowStyle Normal
Write-Host "Frontend PID: $($frontendJob.Id)"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "====================================================="
Write-Host "System Starting..."
Write-Host "====================================================="
Write-Host ""
Write-Host "Backend:  http://localhost:5000"
Write-Host "Frontend: http://localhost:3000 (or 3001)"
Write-Host ""
Write-Host "Waiting for servers to initialize..."
Write-Host "This may take 30-60 seconds on first run"
Write-Host ""
Start-Sleep -Seconds 10

# Open browser
Write-Host "Opening browser..."
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✓ System is ready!"
Write-Host ""
Write-Host "To stop the system, close both command windows or press Ctrl+C"
Write-Host ""

Read-Host "Press Enter to keep this window open"
