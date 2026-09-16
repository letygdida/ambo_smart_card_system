const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET all departments (public)
router.get('/', (req, res) => {
  db.query(`
    SELECT id, department_code, department_name, campus, status
    FROM departments
    WHERE status = 'active'
    ORDER BY department_name ASC
  `, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(results || []);
  });
});

// GET single department by ID (public)
router.get('/:departmentId', (req, res) => {
  const { departmentId } = req.params;

  db.query(`
    SELECT id, department_code, department_name, campus, status
    FROM departments
    WHERE id = ?
  `, [departmentId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(results[0]);
  });
});

// CREATE new department (Admin only)
router.post('/', verifyToken, adminOnly, (req, res) => {
  try {
    const { department_code, department_name, campus } = req.body;

    if (!department_code || !department_name) {
      return res.status(400).json({ error: 'Missing required fields: department_code, department_name' });
    }

    db.query(`
      INSERT INTO departments (department_code, department_name, campus, status)
      VALUES (?, ?, ?, 'active')
    `, [department_code, department_name, campus || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Department code or name already exists' });
        }
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      res.status(201).json({
        message: 'Department created successfully',
        departmentId: result.insertId
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// UPDATE department (Admin only)
router.put('/:departmentId', verifyToken, adminOnly, (req, res) => {
  try {
    const { departmentId } = req.params;
    const { department_code, department_name, campus, status } = req.body;

    // Build update query
    const updates = [];
    const values = [];

    if (department_code) {
      updates.push('department_code = ?');
      values.push(department_code);
    }
    if (department_name) {
      updates.push('department_name = ?');
      values.push(department_name);
    }
    if (campus) {
      updates.push('campus = ?');
      values.push(campus);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(departmentId);

    db.query(`
      UPDATE departments 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values, (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Department code or name already exists' });
        }
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      res.json({ message: 'Department updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
