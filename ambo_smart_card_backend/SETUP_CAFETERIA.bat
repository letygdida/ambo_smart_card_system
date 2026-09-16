@echo off
REM =========================================================
REM Cafeteria Attendance Dashboard - Quick Setup Script
REM =========================================================

echo.
echo.
echo 🍽️  Cafeteria Attendance Dashboard - Setup
echo ==========================================
echo.

REM Check if database schema file exists
if not exist "cafeteria_library_schema.sql" (
    echo ❌ Error: cafeteria_library_schema.sql not found in current directory
    echo Make sure you're in the backend directory
    pause
    exit /b 1
)

echo 📋 Step 1: Running database schema migration...
echo.

REM Run the schema migration
mysql -u root -p ambo_smart_card < cafeteria_library_schema.sql

if %errorlevel% neq 0 (
    echo.
    echo ❌ Database migration failed. Check your MySQL connection.
    echo Common issues:
    echo - MySQL is not running
    echo - Username/password incorrect
    echo - Database 'ambo_smart_card' doesn't exist
    pause
    exit /b 1
)

echo.
echo ✅ Database schema successfully installed!
echo.

echo 📋 Step 2: Verifying tables created...
echo.

REM Verify tables
mysql -u root -p ambo_smart_card -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'ambo_smart_card' AND TABLE_NAME LIKE '%%cafeteria%%' ORDER BY TABLE_NAME;"

echo.
echo 📋 Step 3: Checking meal times configuration...
echo.

mysql -u root -p ambo_smart_card -e "SELECT meal_type, start_time, end_time, is_active FROM meal_times_config ORDER BY CASE WHEN meal_type = 'breakfast' THEN 1 WHEN meal_type = 'lunch' THEN 2 WHEN meal_type = 'dinner' THEN 3 ELSE 4 END;"

echo.
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Restart the backend server: npm start
echo 2. Access dashboard at: http://localhost:3000/cafeteria-attendance
echo 3. Check console for: "✓ Cafeteria attendance routes registered"
echo.

pause
