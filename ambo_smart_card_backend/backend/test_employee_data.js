const db = require('./db');

db.query(`
  SELECT 
    e.*,
    d.department_name
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE e.id = 1
`, (err, results) => {
  if (err) {
    console.error('DB Error:', err);
  } else {
    console.log('Employee with department:', JSON.stringify(results[0], null, 2));
  }
  process.exit(0);
});
