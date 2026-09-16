@echo off
echo ========================================
echo   TESTING ATTENDANCE FLOW
echo ========================================
echo.
echo This will verify the complete attendance flow:
echo  1. Attendance marked successfully
echo  2. Saved to database
echo  3. Appears in View Attendance
echo.

cd "c:\Users\johng\Downloads\ambo_smart_card_system\ambo_smart_card_backend\backend"

echo Checking latest attendance record...
echo.

node -e "const db = require('./db'); db.query('SELECT * FROM employee_attendance_records ORDER BY created_at DESC LIMIT 1', (err, results) => { if (err) { console.error('Error:', err); process.exit(1); } if (results.length === 0) { console.log('No attendance records found'); } else { const r = results[0]; console.log('Latest Attendance Record:'); console.log('========================'); console.log('ID:', r.id); console.log('Employee:', r.employee_name, '(' + r.employee_id + ')'); console.log('Type:', r.employee_type); console.log('Department:', r.department); console.log('Attendance:', r.attendance_type); console.log('Date:', r.scan_date); console.log('Time:', r.scan_time); console.log('Status:', r.status); console.log('Created:', r.created_at); } process.exit(0); });"

echo.
echo ========================================
echo.
echo TO TEST COMPLETE FLOW:
echo 1. Mark attendance for an employee
echo 2. Wait 2 seconds
echo 3. Click "VIEW ATTENDANCE" tab
echo 4. The new record should appear immediately
echo.
echo If not appearing:
echo - Click "APPLY FILTERS" button once
echo - Check if employee_type filter matches
echo.
pause
