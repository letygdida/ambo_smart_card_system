@echo off
ECHO ========================================
ECHO   Fix Employee Type Column Migration
ECHO ========================================
ECHO.
ECHO This script will:
ECHO 1. Change employee_type from ENUM to VARCHAR(100)
ECHO 2. Add position column if missing
ECHO 3. Add index on employee_type
ECHO.
ECHO Press any key to continue...
PAUSE >nul

cd "%~dp0ambo_smart_card_backend\backend"

ECHO.
ECHO Running migration script...
ECHO.

node fix_employee_type_column.js

ECHO.
ECHO ========================================
ECHO   Migration Complete!
ECHO ========================================
ECHO.
ECHO Press any key to exit...
PAUSE >nul
