const db = require('./db');

const query = `
  UPDATE employees 
  SET 
    first_name = ?,
    middle_name = ?,
    last_name = ?,
    gender = ?,
    position = ?,
    department_id = ?,
    email = ?,
    phone = ?,
    employment_status = ?,
    updated_at = NOW()
  WHERE employee_id = ?
`;

db.query(query, [
  'Megarsa',
  'Chimdessa',
  'Regasa',
  'Male',
  'ICT Support Technician',
  2, // Information Systems
  'megarsa@ambo.edu.et',
  '0918681641',
  'active',
  'AU-EMP-2026-0001'
], (err, results) => {
  if (err) {
    console.error('Error updating employee:', err);
  } else {
    console.log('Employee updated successfully!');
    console.log('Employee ID: AU-EMP-2026-0001');
    console.log('Name: Megarsa Regasa');
    console.log('Position: ICT Support Technician');
    console.log('Department: Information Systems');
  }
  process.exit(0);
});
