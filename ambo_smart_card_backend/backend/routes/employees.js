const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// =====================================================
// EMPLOYEE MANAGEMENT ENDPOINTS
// =====================================================

// GET all employees (Admin only)
router.get('/', verifyToken, adminOnly, (req, res) => {
  const { search, department, status, page = 1, limit = 20 } = req.query;
  
  let query = `
    SELECT 
      e.*,
      d.department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (e.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (department) {
    query += ` AND e.department_id = ?`;
    params.push(department);
  }

  if (status) {
    query += ` AND e.employment_status = ?`;
    params.push(status);
  }

  // Pagination
  const offset = (page - 1) * limit;
  query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Employee list query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total FROM employees e
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (e.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (department) {
      countQuery += ` AND e.department_id = ?`;
      countParams.push(department);
    }
    if (status) {
      countQuery += ` AND e.employment_status = ?`;
      countParams.push(status);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        console.error('Count query error:', countErr);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        employees: results,
        pagination: {
          total: countResults[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countResults[0].total / limit)
        }
      });
    });
  });
});

// GET single employee by ID
router.get('/:employeeId', verifyToken, (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  db.query(`
    SELECT 
      e.*,
      d.department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.employee_id = ?
  `, [decodedEmployeeId], (err, results) => {
    if (err) {
      console.error('Single employee query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: `Employee with ID ${decodedEmployeeId} not found` });
    }

    res.json(results[0]);
  });
});

// CREATE new employee (Admin only) - JSON with base64 photo
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const data = req.body || {};
    
    // Safe field extraction
    const firstName = (data.firstName || '').toString().trim();
    const lastName = (data.lastName || '').toString().trim();
    const email = (data.email || '').toString().trim();
    const position = (data.position || '').toString().trim();
    const middleName = (data.middleName || '').toString().trim() || null;
    const gender = (data.gender || '').toString().trim() || null;
    const dateOfBirth = data.dateOfBirth || null;
    const phone = (data.phone || '').toString().trim() || null;
    const employeeType = (data.employeeType || '').toString().trim() || null;
    const staffCategory = (data.staffCategory || '').toString().trim() || null;
    const departmentId = data.departmentId || null;
    const employmentStatus = (data.employmentStatus || 'active').toString().trim();
    const employmentStartDate = data.employmentStartDate || null;
    const faculty = (data.faculty || '').toString().trim() || null;
    const campus = (data.campus || '').toString().trim() || null;
    const officeLocation = (data.officeLocation || '').toString().trim() || null;
    const photoBase64 = data.photo || null;

    // Validation
    if (!firstName || !lastName || !email || !position) {
      return res.status(400).json({ 
        error: 'Missing required fields: firstName, lastName, email, position' 
      });
    }

    // Save base64 photo to file if provided
    let photoPath = null;
    if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image')) {
      try {
        const uploadsDir = path.join(__dirname, '../uploads/employees');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const fileName = `employee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        const filePath = path.join(uploadsDir, fileName);
        
        fs.writeFileSync(filePath, base64Data, 'base64');
        photoPath = `/uploads/employees/${fileName}`;
      } catch (photoErr) {
        console.error('Photo save error:', photoErr);
      }
    }

    // Check email uniqueness
    db.query('SELECT id FROM employees WHERE email = ?', [email], (emailErr, emailResults) => {
      if (emailErr) {
        return res.status(500).json({ error: 'Database error', details: emailErr.message });
      }

      if (emailResults && emailResults.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Generate unique Employee ID
      const year = new Date().getFullYear();
      db.query('SELECT MAX(id) as maxId FROM employees', (idErr, idResults) => {
        if (idErr) {
          return res.status(500).json({ error: 'Database error', details: idErr.message });
        }

        const nextId = (idResults && idResults[0] && idResults[0].maxId) ? (idResults[0].maxId + 1) : 1;
        const employeeId = `AU-EMP-${year}-${String(nextId).padStart(4, '0')}`;

        // Generate QR code
        QRCode.toDataURL(employeeId, {
          width: 200,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        }, (qrErr, qrCodeUrl) => {
          if (qrErr) {
            console.error('QR Code generation error:', qrErr);
            qrCodeUrl = null;
          }

          const insertQuery = `
            INSERT INTO employees (
              employee_id, first_name, middle_name, last_name, gender, date_of_birth,
              phone, email, photo, employee_type, staff_category, department_id, position,
              employment_status, employment_start_date, faculty, campus, office_location,
              qr_code, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const values = [
            employeeId, firstName, middleName, lastName, gender, dateOfBirth,
            phone, email, photoPath, employeeType, staffCategory, departmentId, position,
            employmentStatus, employmentStartDate, faculty, campus, officeLocation,
            qrCodeUrl, req.user?.username || 'system'
          ];

          db.query(insertQuery, values, (insertErr, insertResults) => {
            if (insertErr) {
              console.error('Insert error:', insertErr);
              return res.status(500).json({ 
                error: 'Failed to create employee', 
                details: insertErr.message 
              });
            }

            res.status(201).json({
              message: 'Employee created successfully',
              employeeId: employeeId
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// UPDATE employee (Admin only) - JSON with base64 photo
router.put('/:employeeId', verifyToken, adminOnly, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const data = req.body || {};

    // Get current employee
    db.query('SELECT * FROM employees WHERE employee_id = ?', [employeeId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const employee = results[0];
      const updateFields = {};
      
      // Map form fields to database columns
      const fieldMap = {
        'firstName': 'first_name',
        'middleName': 'middle_name',
        'lastName': 'last_name',
        'gender': 'gender',
        'dateOfBirth': 'date_of_birth',
        'phone': 'phone',
        'email': 'email',
        'employeeType': 'employee_type',
        'staffCategory': 'staff_category',
        'departmentId': 'department_id',
        'position': 'position',
        'employmentStatus': 'employment_status',
        'employmentStartDate': 'employment_start_date',
        'faculty': 'faculty',
        'campus': 'campus',
        'officeLocation': 'office_location'
      };

      // Safe field extraction
      Object.keys(fieldMap).forEach(key => {
        const dbColumn = fieldMap[key];
        const value = data[key];
        
        if (value !== undefined && value !== null && value !== '') {
          updateFields[dbColumn] = value.toString().trim();
        }
      });

      // Handle photo - base64 to file
      if (data.photo && data.photo.startsWith && data.photo.startsWith('data:image')) {
        try {
          const uploadsDir = path.join(__dirname, '../uploads/employees');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          const base64Data = data.photo.replace(/^data:image\/\w+;base64,/, '');
          const fileName = `employee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
          const filePath = path.join(uploadsDir, fileName);
          
          fs.writeFileSync(filePath, base64Data, 'base64');
          updateFields.photo = `/uploads/employees/${fileName}`;
          
          // Delete old photo if it exists
          if (employee.photo) {
            try {
              const oldPath = path.join(__dirname, '..', employee.photo);
              if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
              }
            } catch (e) {
              console.log('Could not delete old photo:', e.message);
            }
          }
        } catch (photoErr) {
          console.error('Photo save error:', photoErr);
        }
      }

      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Build SQL update query
      const fields = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
      const values = Object.values(updateFields);
      values.push(employeeId);

      const updateQuery = `UPDATE employees SET ${fields}, updated_at = NOW() WHERE employee_id = ?`;

      db.query(updateQuery, values, (updateErr) => {
        if (updateErr) {
          console.error('Update error:', updateErr);
          return res.status(500).json({ error: 'Failed to update employee', details: updateErr.message });
        }

        res.json({ success: true, message: 'Employee updated successfully' });
      });
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// DEACTIVATE employee (Admin only)
router.post('/:employeeId/deactivate', verifyToken, adminOnly, (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  console.log(`Deactivating employee: ${decodedEmployeeId}`);

  db.query(
    'UPDATE employees SET employment_status = ?, updated_at = NOW() WHERE employee_id = ?',
    ['inactive', decodedEmployeeId],
    (err) => {
      if (err) {
        console.error('Deactivate error:', err);
        return res.status(500).json({ error: 'Failed to deactivate employee', details: err.message });
      }

      const logQuery = `
        INSERT INTO employee_activity_logs (employee_id, action, performed_by, created_at)
        VALUES (?, 'Deactivated', ?, NOW())
      `;
      db.query(logQuery, [decodedEmployeeId, req.user?.username || 'system'], (logErr) => {
        if (logErr) console.error('Log error:', logErr);

        res.json({ 
          message: 'Employee deactivated successfully', 
          employeeId: decodedEmployeeId,
          newStatus: 'inactive'
        });
      });
    }
  );
});

// REACTIVATE employee (Admin only)
router.post('/:employeeId/reactivate', verifyToken, adminOnly, (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  console.log(`Reactivating employee: ${decodedEmployeeId}`);

  db.query(
    'UPDATE employees SET employment_status = ?, updated_at = NOW() WHERE employee_id = ?',
    ['active', decodedEmployeeId],
    (err) => {
      if (err) {
        console.error('Reactivate error:', err);
        return res.status(500).json({ error: 'Failed to reactivate employee', details: err.message });
      }

      const logQuery = `
        INSERT INTO employee_activity_logs (employee_id, action, performed_by, created_at)
        VALUES (?, 'Reactivated', ?, NOW())
      `;
      db.query(logQuery, [decodedEmployeeId, req.user?.username || 'system'], (logErr) => {
        if (logErr) console.error('Log error:', logErr);

        res.json({
          message: 'Employee reactivated successfully',
          employeeId: decodedEmployeeId,
          newStatus: 'active'
        });
      });
    }
  );
});

// GENERATE SMART CARD (Admin only)
router.post('/:employeeId/generate-card', verifyToken, adminOnly, async (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  console.log(`Generating card for employee: ${decodedEmployeeId}`);

  db.query('SELECT * FROM employees WHERE employee_id = ?', [decodedEmployeeId], async (err, results) => {
    if (err) {
      console.error('Employee query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: `Employee with ID ${decodedEmployeeId} not found` });
    }

    const employee = results[0];
    const year = new Date().getFullYear();
    const cardNumber = `CARD-EMP-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    const qrData = JSON.stringify({
      employeeId: employee.employee_id,
      cardNumber: cardNumber,
      fullName: `${employee.first_name} ${employee.last_name}`,
      position: employee.position,
      department: employee.department_id,
      timestamp: new Date().toISOString()
    });

    try {
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      });

      const updateQuery = `
        UPDATE employees 
        SET card_number = ?, qr_code = ?, card_status = 'active', card_generated_date = NOW(), updated_at = NOW()
        WHERE employee_id = ?
      `;

      db.query(updateQuery, [cardNumber, qrCodeUrl, decodedEmployeeId], (updateErr) => {
        if (updateErr) {
          console.error('Card update error:', updateErr);
          return res.status(500).json({ error: 'Failed to generate card', details: updateErr.message });
        }

        const cardQuery = `
          INSERT INTO employee_smart_cards (card_id, employee_id, card_number, qr_code, card_status, issue_date, issued_by, created_at)
          VALUES (?, ?, ?, ?, 'active', NOW(), ?, NOW())
        `;

        db.query(cardQuery, [cardNumber, decodedEmployeeId, cardNumber, qrCodeUrl, req.user?.username || 'system'], (cardErr) => {
          if (cardErr) console.error('Card record error:', cardErr);

          const logQuery = `
            INSERT INTO employee_activity_logs (employee_id, action, performed_by, description, created_at)
            VALUES (?, 'Card Generated', ?, ?, NOW())
          `;
          db.query(logQuery, [decodedEmployeeId, req.user?.username || 'system', `Card ${cardNumber} generated`]);

          console.log(`Card generated successfully for employee: ${decodedEmployeeId}`);

          res.json({
            message: 'Smart Card generated successfully',
            cardNumber: cardNumber,
            qrCode: qrCodeUrl,
            employeeId: decodedEmployeeId
          });
        });
      });
    } catch (qrError) {
      console.error('QR code generation error:', qrError);
      res.status(500).json({ error: 'Failed to generate QR code', details: qrError.message });
    }
  });
});

// GET employee smart card
router.get('/:employeeId/card', verifyToken, (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  db.query(
    'SELECT * FROM employee_smart_cards WHERE employee_id = ? AND card_status = ? ORDER BY created_at DESC LIMIT 1',
    [decodedEmployeeId, 'active'],
    (err, results) => {
      if (err) {
        console.error('Card query error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (!results || results.length === 0) {
        return res.status(404).json({ error: `No active card found for employee ${decodedEmployeeId}` });
      }

      res.json(results[0]);
    }
  );
});

// REPLACE smart card (Admin only)
router.post('/:employeeId/replace-card', verifyToken, adminOnly, async (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);
  const { reason } = req.body;

  console.log(`Replacing card for employee: ${decodedEmployeeId}`);

  db.query(
    'UPDATE employee_smart_cards SET card_status = ? WHERE employee_id = ? AND card_status = ?',
    ['inactive', decodedEmployeeId, 'active'],
    (deactivateErr) => {
      if (deactivateErr) {
        console.error('Deactivate card error:', deactivateErr);
        return res.status(500).json({ error: 'Failed to replace card', details: deactivateErr.message });
      }

      db.query('SELECT * FROM employees WHERE employee_id = ?', [decodedEmployeeId], async (err, results) => {
        if (err) {
          console.error('Employee query error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!results || results.length === 0) {
          return res.status(404).json({ error: `Employee with ID ${decodedEmployeeId} not found` });
        }

        const employee = results[0];
        const year = new Date().getFullYear();
        const newCardNumber = `CARD-EMP-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

        const qrData = JSON.stringify({
          employeeId: employee.employee_id,
          cardNumber: newCardNumber,
          fullName: `${employee.first_name} ${employee.last_name}`,
          position: employee.position
        });

        try {
          const qrCodeUrl = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
          });

          const cardQuery = `
            INSERT INTO employee_smart_cards (card_id, employee_id, card_number, qr_code, card_status, reason_for_replacement, issue_date, issued_by, created_at)
            VALUES (?, ?, ?, ?, 'active', ?, NOW(), ?, NOW())
          `;

          db.query(cardQuery, [newCardNumber, decodedEmployeeId, newCardNumber, qrCodeUrl, reason || 'Card Replacement', req.user?.username || 'system'], (cardErr) => {
            if (cardErr) {
              console.error('New card creation error:', cardErr);
              return res.status(500).json({ error: 'Failed to create replacement card', details: cardErr.message });
            }

            db.query(
              'UPDATE employees SET card_number = ?, card_status = ?, updated_at = NOW() WHERE employee_id = ?',
              [newCardNumber, 'active', decodedEmployeeId],
              (updateErr) => {
                if (updateErr) console.error('Employee update error:', updateErr);

                res.json({
                  message: 'Smart Card replaced successfully',
                  newCardNumber: newCardNumber,
                  employeeId: decodedEmployeeId
                });
              }
            );
          });
        } catch (qrError) {
          console.error('QR code generation error:', qrError);
          res.status(500).json({ error: 'Failed to generate replacement card', details: qrError.message });
        }
      });
    }
  );
});

// VERIFY employee QR code
router.post('/verify', async (req, res) => {
  const { cardNumber } = req.body;

  db.query(
    'SELECT e.*, esc.card_status FROM employees e JOIN employee_smart_cards esc ON e.employee_id = esc.employee_id WHERE esc.card_number = ?',
    [cardNumber],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length === 0) return res.status(404).json({ verified: false, error: 'Card not found' });

      const employee = results[0];

      if (employee.card_status !== 'active') {
        return res.json({
          verified: false,
          message: 'Card is not active',
          cardStatus: employee.card_status
        });
      }

      res.json({
        verified: true,
        employee: {
          employeeId: employee.employee_id,
          fullName: `${employee.first_name} ${employee.last_name}`,
          position: employee.position,
          department: employee.department_id,
          email: employee.email,
          phone: employee.phone,
          status: employee.employment_status,
          photo: employee.photo
        }
      });
    }
  );
});

// GET employee activity logs
router.get('/:employeeId/activity-logs', verifyToken, (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  db.query(
    'SELECT * FROM employee_activity_logs WHERE employee_id = ? ORDER BY created_at DESC LIMIT 50',
    [decodedEmployeeId],
    (err, results) => {
      if (err) {
        console.error('Activity logs query error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json(results || []);
    }
  );
});

// IMPORT employees from Excel (Admin only)
router.post('/import/bulk', verifyToken, adminOnly, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data found in Excel file' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      employees: []
    };

    // Column mapping - adjust based on your Excel headers
    const processRow = async (row, index) => {
      try {
        // Map Excel columns to database fields
        const firstName = (row['First Name'] || row['first_name'] || '').toString().trim();
        const lastName = (row['Last Name'] || row['last_name'] || '').toString().trim();
        const email = (row['Email'] || row['email'] || '').toString().trim();
        const position = (row['Position'] || row['position'] || '').toString().trim();
        const departmentName = (row['Department'] || row['department'] || '').toString().trim();
        const phone = (row['Phone'] || row['phone'] || '').toString().trim() || null;
        const gender = (row['Gender'] || row['gender'] || '').toString().trim() || null;
        const employeeType = (row['Employee Type'] || row['employee_type'] || '').toString().trim() || null;

        // Validation
        if (!firstName || !lastName || !email || !position) {
          results.errors.push({
            row: index + 2,
            error: 'Missing required fields: First Name, Last Name, Email, Position'
          });
          results.failed++;
          return;
        }

        // Get department ID from name
        let departmentId = null;
        if (departmentName) {
          const deptResult = await new Promise((resolve) => {
            db.query('SELECT id FROM departments WHERE department_name = ? LIMIT 1', [departmentName], (err, rows) => {
              resolve(err ? null : (rows && rows[0] ? rows[0].id : null));
            });
          });
          departmentId = deptResult;
        }

        // Check email uniqueness
        const emailExists = await new Promise((resolve) => {
          db.query('SELECT id FROM employees WHERE email = ? LIMIT 1', [email], (err, rows) => {
            resolve(err ? false : (rows && rows.length > 0));
          });
        });

        if (emailExists) {
          results.errors.push({
            row: index + 2,
            error: `Email ${email} already exists`
          });
          results.failed++;
          return;
        }

        // Generate Employee ID
        const year = new Date().getFullYear();
        const maxId = await new Promise((resolve) => {
          db.query('SELECT MAX(id) as maxId FROM employees', (err, rows) => {
            resolve(err ? 0 : (rows && rows[0] ? rows[0].maxId : 0));
          });
        });
        const nextId = maxId + 1;
        const employeeId = `AU-EMP-${year}-${String(nextId).padStart(4, '0')}`;

        // Generate QR code
        const qrCodeUrl = await new Promise((resolve) => {
          QRCode.toDataURL(employeeId, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
          }, (err, url) => {
            resolve(err ? null : url);
          });
        });

        // Insert into database
        const insertQuery = `
          INSERT INTO employees (
            employee_id, first_name, last_name, gender, phone, email, 
            employee_type, department_id, position, employment_status,
            qr_code, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await new Promise((resolve, reject) => {
          db.query(insertQuery, [
            employeeId, firstName, lastName, gender, phone, email,
            employeeType, departmentId, position, 'active', qrCodeUrl, req.user?.username || 'system'
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        results.employees.push({ employeeId, firstName, lastName, email });
        results.success++;
      } catch (err) {
        results.errors.push({
          row: index + 2,
          error: err.message
        });
        results.failed++;
      }
    };

    // Process all rows
    for (let i = 0; i < data.length; i++) {
      await processRow(data[i], i);
    }

    res.json({
      message: `Import complete: ${results.success} succeeded, ${results.failed} failed`,
      ...results
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import employees', details: err.message });
  }
});

// DELETE employee (Admin only)
router.delete('/:employeeId', verifyToken, adminOnly, (req, res) => {
  const { employeeId } = req.params;
  const decodedEmployeeId = decodeURIComponent(employeeId);

  console.log(`Deleting employee: ${decodedEmployeeId}`);

  // First, get employee details to delete associated files
  db.query('SELECT * FROM employees WHERE employee_id = ?', [decodedEmployeeId], (err, results) => {
    if (err) {
      console.error('Employee query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: `Employee with ID ${decodedEmployeeId} not found` });
    }

    const employee = results[0];

    // Delete associated photo if exists
    if (employee.photo) {
      try {
        const photoPath = path.join(__dirname, '..', employee.photo);
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
          console.log('Deleted photo:', photoPath);
        }
      } catch (photoErr) {
        console.error('Error deleting photo:', photoErr);
      }
    }

    // Delete smart cards
    db.query('DELETE FROM employee_smart_cards WHERE employee_id = ?', [decodedEmployeeId], (cardErr) => {
      if (cardErr) console.error('Error deleting cards:', cardErr);

      // Delete activity logs
      db.query('DELETE FROM employee_activity_logs WHERE employee_id = ?', [decodedEmployeeId], (logErr) => {
        if (logErr) console.error('Error deleting logs:', logErr);

        // Delete employee record
        db.query('DELETE FROM employees WHERE employee_id = ?', [decodedEmployeeId], (deleteErr) => {
          if (deleteErr) {
            console.error('Delete error:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete employee', details: deleteErr.message });
          }

          // Log deletion action
          const auditQuery = `
            INSERT INTO employee_activity_logs (employee_id, action, performed_by, description, created_at)
            VALUES (?, 'Deleted', ?, 'Employee record permanently deleted', NOW())
          `;
          db.query(auditQuery, [decodedEmployeeId, req.user?.username || 'system'], (auditErr) => {
            if (auditErr) console.error('Audit log error:', auditErr);
          });

          res.json({
            message: 'Employee deleted successfully',
            employeeId: decodedEmployeeId
          });
        });
      });
    });
  });
});

// GET employee dashboard statistics
router.get('/dashboard/stats', verifyToken, adminOnly, (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN employment_status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN employment_status != 'active' THEN 1 ELSE 0 END) as inactive,
      SUM(CASE WHEN card_status = 'active' THEN 1 ELSE 0 END) as cards_issued,
      SUM(CASE WHEN card_status IS NULL THEN 1 ELSE 0 END) as cards_pending
    FROM employees
  `;

  db.query(statsQuery, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results[0]);
  });
});

module.exports = router;
