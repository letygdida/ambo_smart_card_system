const db = require('./db');

const employeeData = {
  employee_id: 'AU-EMP-2026-0002',
  first_name: 'Megarsa',
  middle_name: 'Chimdessa',
  last_name: 'Regasa',
  gender: 'Male',
  date_of_birth: '1996-01-31',
  phone: '0918681641',
  email: 'megarsa@ambo.edu.et',
  employee_type: 'Technical Staff',
  staff_category: '',
  department_id: 1, // Information Technology
  position: 'ICT Support Technician',
  employment_status: 'active',
  employment_start_date: '2026-01-15',
  faculty: '',
  campus: 'Main Campus',
  office_location: 'ICT Building',
  photo: '/uploads/employees/sample-photo.png',
  card_status: 'active',
  created_by: 'admin'
};

const query = `
  INSERT INTO employees 
  (employee_id, first_name, middle_name, last_name, gender, date_of_birth, phone, email, 
   employee_type, staff_category, department_id, position, employment_status, employment_start_date, 
   faculty, campus, office_location, photo, card_status, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`;

db.query(query, [
  employeeData.employee_id,
  employeeData.first_name,
  employeeData.middle_name,
  employeeData.last_name,
  employeeData.gender,
  employeeData.date_of_birth,
  employeeData.phone,
  employeeData.email,
  employeeData.employee_type,
  employeeData.staff_category,
  employeeData.department_id,
  employeeData.position,
  employeeData.employment_status,
  employeeData.employment_start_date,
  employeeData.faculty,
  employeeData.campus,
  employeeData.office_location,
  employeeData.photo,
  employeeData.card_status,
  employeeData.created_by
], (err, results) => {
  if (err) {
    console.error('Error inserting employee:', err);
  } else {
    console.log('Employee added successfully!');
    console.log('Employee ID:', employeeData.employee_id);
    console.log('Name:', employeeData.first_name + ' ' + employeeData.last_name);
    console.log('Position:', employeeData.position);
  }
  process.exit(0);
});
