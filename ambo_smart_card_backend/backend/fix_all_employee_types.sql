-- PERMANENT FIX: Ensure all employees have employee_type set
-- This SQL script updates the database to fix attendance display issues

USE ambo_smart_card;

-- Step 1: Change employee_attendance_records.employee_type from ENUM to VARCHAR
ALTER TABLE employee_attendance_records 
MODIFY COLUMN employee_type VARCHAR(100) NULL 
COMMENT 'Staff type: Academic Staff, Administrative Staff, Technical Staff, Support Staff, Security Staff, Management, etc.';

-- Step 2: Add position column if it doesn't exist
ALTER TABLE employee_attendance_records 
ADD COLUMN IF NOT EXISTS position VARCHAR(255) NULL 
COMMENT 'Employee position/title'
AFTER campus;

-- Step 3: Update attendance records with NULL employee_type from employees table
UPDATE employee_attendance_records ear
INNER JOIN employees e ON ear.employee_id = e.employee_id
SET ear.employee_type = COALESCE(e.employee_type, 'Unassigned'),
    ear.position = COALESCE(ear.position, e.position),
    ear.department = COALESCE(ear.department, e.department_name),
    ear.campus = COALESCE(ear.campus, e.campus)
WHERE ear.employee_type IS NULL OR ear.employee_type = '';

-- Step 4: Set default employee_type for employees who don't have one
-- You can customize these rules based on your institution's structure
UPDATE employees 
SET employee_type = 'Administrative Staff'
WHERE (employee_type IS NULL OR employee_type = '')
  AND (position LIKE '%admin%' OR position LIKE '%manager%' OR position LIKE '%director%');

UPDATE employees 
SET employee_type = 'Academic Staff'
WHERE (employee_type IS NULL OR employee_type = '')
  AND (position LIKE '%professor%' OR position LIKE '%lecturer%' OR position LIKE '%instructor%' OR position LIKE '%teacher%');

UPDATE employees 
SET employee_type = 'Technical Staff'
WHERE (employee_type IS NULL OR employee_type = '')
  AND (position LIKE '%technician%' OR position LIKE '%IT%' OR position LIKE '%tech%' OR position LIKE '%engineer%');

UPDATE employees 
SET employee_type = 'Support Staff'
WHERE (employee_type IS NULL OR employee_type = '')
  AND (position LIKE '%support%' OR position LIKE '%assistant%' OR position LIKE '%clerk%');

UPDATE employees 
SET employee_type = 'Security Staff'
WHERE (employee_type IS NULL OR employee_type = '')
  AND (position LIKE '%security%' OR position LIKE '%guard%');

-- Step 5: Set 'Other' for any remaining employees without a type
UPDATE employees 
SET employee_type = 'Other'
WHERE employee_type IS NULL OR employee_type = '';

-- Step 6: Verify the fix
SELECT 
    'Employees by Type' as category,
    COALESCE(employee_type, 'NULL') as type,
    COUNT(*) as count
FROM employees
GROUP BY employee_type
ORDER BY count DESC;

SELECT 
    'Attendance Records by Type' as category,
    COALESCE(employee_type, 'NULL') as type,
    COUNT(*) as count
FROM employee_attendance_records
GROUP BY employee_type
ORDER BY count DESC;

-- Done!
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as status;
