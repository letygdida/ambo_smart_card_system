const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// GET all departments (public)
router.get('/', (req, res) => {
  db.query(`
    SELECT id, code as department_code, name as department_name
    FROM departments
    ORDER BY name ASC
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
    SELECT id, code as department_code, name as department_name
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
    const { department_code, department_name } = req.body;

    if (!department_code || !department_name) {
      return res.status(400).json({ error: 'Missing required fields: department_code, department_name' });
    }

    db.query(`
      INSERT INTO departments (code, name)
      VALUES (?, ?)
    `, [department_code, department_name], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Department code already exists' });
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
    const { department_code, department_name } = req.body;

    const updates = [];
    const values = [];

    if (department_code) {
      updates.push('code = ?');
      values.push(department_code);
    }
    if (department_name) {
      updates.push('name = ?');
      values.push(department_name);
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
          return res.status(400).json({ error: 'Department code already exists' });
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
