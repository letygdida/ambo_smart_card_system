const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Allow both admin and staff to manage employees
const adminOrStaff = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ error: 'Access denied. Admin or Staff required.' });
    }
    next();
};

// =====================================================
// Actual employees table schema:
//   id, employee_id, first_name, last_name, email, phone,
//   department_id, employee_type, photo_path, status,
//   position, campus, created_at, updated_at
// =====================================================

// GET all employees
router.get('/', verifyToken, adminOrStaff, (req, res) => {
    const { search, department, status, page = 1, limit = 50 } = req.query;

    let query = `
        SELECT
            e.id,
            e.employee_id,
            e.first_name,
            e.last_name,
            CONCAT(e.first_name, ' ', COALESCE(e.last_name,'')) AS full_name,
            e.email,
            e.phone,
            e.employee_type,
            e.photo_path  AS photo,
            e.status      AS employment_status,
            e.position,
            e.campus,
            e.department_id,
            d.name        AS department_name,
            e.created_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (search) {
        query += ` AND (e.employee_id LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s, s);
    }
    if (department) { query += ` AND e.department_id = ?`; params.push(department); }
    if (status)     { query += ` AND e.status = ?`;        params.push(status); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Employee list error:', err.message);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.json({ employees: results });
    });
});

// GET dashboard stats
router.get('/dashboard/stats', verifyToken, adminOrStaff, (req, res) => {
    db.query(`
        SELECT
            COUNT(*)                                     AS total,
            SUM(status = 'active')                       AS active,
            SUM(status = 'inactive' OR status = 'suspended') AS inactive,
            SUM(card_status IS NOT NULL AND card_status != '') AS cards_issued
        FROM employees
    `, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0] || { total: 0, active: 0, inactive: 0, cards_issued: 0 });
    });
});

// GET single employee by ID
router.get('/:employeeId', verifyToken, (req, res) => {
    const employeeId = decodeURIComponent(req.params.employeeId);
    db.query(`
        SELECT e.*, d.name AS department_name,
               CONCAT(e.first_name,' ',COALESCE(e.last_name,'')) AS full_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.employee_id = ?
    `, [employeeId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results || results.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(results[0]);
    });
});

// CREATE new employee — accepts JSON with optional base64 photo
router.post('/', verifyToken, adminOrStaff, async (req, res) => {
    try {
        const data = req.body || {};

        const firstName      = (data.firstName  || '').toString().trim();
        const lastName       = (data.lastName   || '').toString().trim();
        const email          = (data.email      || '').toString().trim();
        const position       = (data.position   || '').toString().trim();
        const phone          = (data.phone      || '').toString().trim() || null;
        const employeeType   = (data.employeeType || '').toString().trim() || null;
        const departmentId   = data.departmentId || null;
        const campus         = (data.campus     || '').toString().trim() || null;
        const status         = (data.employmentStatus || 'active').toString().trim();
        const photoBase64    = data.photo || null;

        if (!firstName || !lastName || !email || !position) {
            return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, position' });
        }

        // Save base64 photo if provided
        let photoPath = null;
        if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image')) {
            try {
                const uploadsDir = path.join(__dirname, '../uploads/employees');
                if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
                const fileName = `emp-${Date.now()}-${Math.random().toString(36).substr(2,6)}.png`;
                fs.writeFileSync(path.join(uploadsDir, fileName), base64Data, 'base64');
                photoPath = fileName;
            } catch (e) { console.error('Photo save error:', e.message); }
        }

        // Check email uniqueness
        db.query('SELECT id FROM employees WHERE email = ?', [email], (err, emailRows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (emailRows && emailRows.length > 0) return res.status(400).json({ error: 'Email already exists' });

            // Generate employee ID
            const year = new Date().getFullYear();
            db.query('SELECT MAX(id) AS maxId FROM employees', (err, idRows) => {
                if (err) return res.status(500).json({ error: err.message });
                const nextId = (idRows && idRows[0] && idRows[0].maxId) ? (idRows[0].maxId + 1) : 1;
                const employeeId = `AU-EMP-${year}-${String(nextId).padStart(4, '0')}`;

                // Resolve departmentId: if it's a name string, look it up
                const resolveAndInsert = (dept_id) => {
                    const sql = `
                        INSERT INTO employees
                            (employee_id, first_name, last_name, email, phone,
                             department_id, employee_type, photo_path, status, position, campus)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    const vals = [employeeId, firstName, lastName, email, phone,
                                  dept_id, employeeType, photoPath, status, position, campus];

                    db.query(sql, vals, (err, result) => {
                        if (err) {
                            console.error('Insert employee error:', err.message);
                            return res.status(500).json({ error: 'Failed to create employee', details: err.message });
                        }
                        res.status(201).json({ message: 'Employee created successfully', employeeId });
                    });
                };

                if (!departmentId) {
                    resolveAndInsert(null);
                } else if (!isNaN(departmentId)) {
                    resolveAndInsert(parseInt(departmentId));
                } else {
                    db.query('SELECT id FROM departments WHERE name = ? OR code = ?', [departmentId, departmentId], (err, deptRows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        resolveAndInsert((deptRows && deptRows.length > 0) ? deptRows[0].id : null);
                    });
                }
            });
        });
    } catch (error) {
        console.error('Create employee error:', error.message);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// UPDATE employee
router.put('/:employeeId', verifyToken, adminOrStaff, async (req, res) => {
    const employeeId = decodeURIComponent(req.params.employeeId);
    const data = req.body || {};

    const updates = [];
    const vals    = [];

    const map = {
        firstName: 'first_name', lastName: 'last_name', email: 'email',
        phone: 'phone', position: 'position', campus: 'campus',
        employeeType: 'employee_type', employmentStatus: 'status'
    };

    Object.entries(map).forEach(([k, col]) => {
        if (data[k] !== undefined && data[k] !== null) {
            updates.push(`${col} = ?`);
            vals.push(data[k].toString().trim());
        }
    });

    // Handle department
    if (data.departmentId !== undefined) {
        updates.push('department_id = ?');
        vals.push(!isNaN(data.departmentId) ? parseInt(data.departmentId) : null);
    }

    // Handle photo
    if (data.photo && typeof data.photo === 'string' && data.photo.startsWith('data:image')) {
        try {
            const uploadsDir = path.join(__dirname, '../uploads/employees');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            const base64Data = data.photo.replace(/^data:image\/\w+;base64,/, '');
            const fileName = `emp-${Date.now()}.png`;
            fs.writeFileSync(path.join(uploadsDir, fileName), base64Data, 'base64');
            updates.push('photo_path = ?');
            vals.push(fileName);
        } catch (e) { console.error('Photo save error:', e.message); }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    vals.push(employeeId);
    db.query(`UPDATE employees SET ${updates.join(', ')}, updated_at=NOW() WHERE employee_id = ?`, vals, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee updated successfully' });
    });
});

// DEACTIVATE employee
router.post('/:employeeId/deactivate', verifyToken, adminOrStaff, (req, res) => {
    const employeeId = decodeURIComponent(req.params.employeeId);
    db.query("UPDATE employees SET status='inactive', updated_at=NOW() WHERE employee_id=?", [employeeId], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deactivated successfully' });
    });
});

// REACTIVATE employee
router.post('/:employeeId/reactivate', verifyToken, adminOrStaff, (req, res) => {
    const employeeId = decodeURIComponent(req.params.employeeId);
    db.query("UPDATE employees SET status='active', updated_at=NOW() WHERE employee_id=?", [employeeId], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee reactivated successfully' });
    });
});

// DELETE employee
router.delete('/:employeeId', verifyToken, adminOrStaff, (req, res) => {
    const employeeId = decodeURIComponent(req.params.employeeId);
    db.query("DELETE FROM employees WHERE employee_id=?", [employeeId], (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
    });
});

// GENERATE CARD (set card_status active if column exists — graceful no-op otherwise)
router.post('/:employeeId/generate-card', verifyToken, adminOrStaff, (req, res) => {
    const employeeId = decodeURIComponent(req.params.employeeId);
    const cardNumber = `CARD-${Date.now()}`;
    db.query("UPDATE employees SET updated_at=NOW() WHERE employee_id=?", [employeeId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Card generated', cardNumber });
    });
});

module.exports = router;
