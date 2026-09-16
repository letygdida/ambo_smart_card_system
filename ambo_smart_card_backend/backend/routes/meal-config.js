const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, adminOnly } = require('../middleware/auth');

// =====================================================
// MEAL TIMES CONFIGURATION ENDPOINTS
// =====================================================

// GET all meal time configurations
router.get('/meal-times', (req, res) => {
  const query = `
    SELECT 
      id,
      meal_type,
      start_time,
      end_time,
      is_active,
      daily_limit,
      description
    FROM meal_times_config
    ORDER BY 
      CASE 
        WHEN meal_type = 'breakfast' THEN 1
        WHEN meal_type = 'lunch' THEN 2
        WHEN meal_type = 'dinner' THEN 3
        ELSE 4
      END
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Meal times query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.json({
      success: true,
      mealTimes: results,
      total: results.length
    });
  });
});

// GET meal time configuration for a specific meal type
router.get('/meal-times/:mealType', (req, res) => {
  const { mealType } = req.params;

  const query = `
    SELECT 
      id,
      meal_type,
      start_time,
      end_time,
      is_active,
      daily_limit,
      description
    FROM meal_times_config
    WHERE meal_type = ? AND is_active = TRUE
  `;

  db.query(query, [mealType.toLowerCase()], (err, results) => {
    if (err) {
      console.error('❌ Meal time query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: `Meal type "${mealType}" not found or inactive` });
    }

    res.json({
      success: true,
      mealTime: results[0]
    });
  });
});

// GET current active meal type based on system time
router.get('/current-meal', (req, res) => {
  const query = `
    SELECT 
      meal_type,
      start_time,
      end_time
    FROM meal_times_config
    WHERE is_active = TRUE
    ORDER BY 
      CASE 
        WHEN meal_type = 'breakfast' THEN 1
        WHEN meal_type = 'lunch' THEN 2
        WHEN meal_type = 'dinner' THEN 3
        ELSE 4
      END
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Current meal query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Get current time
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Find matching meal
    let currentMeal = null;
    for (const meal of results) {
      if (currentTimeStr >= meal.start_time && currentTimeStr < meal.end_time) {
        currentMeal = meal;
        break;
      }
    }

    res.json({
      success: true,
      currentMeal: currentMeal,
      currentTime: currentTimeStr,
      availableMeals: results
    });
  });
});

// UPDATE meal time configuration (Admin only)
router.put('/meal-times/:mealType', verifyToken, adminOnly, (req, res) => {
  const { mealType } = req.params;
  const { startTime, endTime, dailyLimit, description, isActive } = req.body;

  // Validation
  if (!startTime || !endTime) {
    return res.status(400).json({ error: 'startTime and endTime are required' });
  }

  // Validate time format (HH:MM or HH:MM:SS)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({ error: 'Invalid time format. Use HH:MM or HH:MM:SS' });
  }

  const query = `
    UPDATE meal_times_config
    SET 
      start_time = ?,
      end_time = ?,
      daily_limit = ?,
      description = ?,
      is_active = ?,
      updated_at = NOW()
    WHERE meal_type = ?
  `;

  db.query(
    query,
    [startTime, endTime, dailyLimit || 1, description || '', isActive !== false, mealType.toLowerCase()],
    (err, results) => {
      if (err) {
        console.error('❌ Update meal time error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: `Meal type "${mealType}" not found` });
      }

      res.json({
        success: true,
        message: `Meal time for "${mealType}" updated successfully`,
        mealType: mealType.toLowerCase(),
        startTime,
        endTime,
        dailyLimit,
        description
      });
    }
  );
});

// =====================================================
// SCANNER LOCATIONS CONFIGURATION ENDPOINTS
// =====================================================

// GET all scanner locations
router.get('/scanners', (req, res) => {
  const { locationType, isActive } = req.query;

  let query = `
    SELECT 
      id,
      scanner_id,
      location_type,
      location_name,
      building,
      floor,
      campus,
      is_active,
      notes,
      created_at
    FROM scanner_locations
    WHERE 1=1
  `;

  const params = [];

  if (locationType) {
    query += ` AND location_type = ?`;
    params.push(locationType.toLowerCase());
  }

  if (isActive !== undefined) {
    query += ` AND is_active = ?`;
    params.push(isActive === 'true' || isActive === true ? 1 : 0);
  }

  query += ` ORDER BY location_type, location_name`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('❌ Scanner locations query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.json({
      success: true,
      scanners: results,
      total: results.length
    });
  });
});

// GET scanner location by scanner_id
router.get('/scanners/:scannerId', (req, res) => {
  const { scannerId } = req.params;

  const query = `
    SELECT 
      id,
      scanner_id,
      location_type,
      location_name,
      building,
      floor,
      campus,
      is_active,
      notes
    FROM scanner_locations
    WHERE scanner_id = ?
  `;

  db.query(query, [scannerId], (err, results) => {
    if (err) {
      console.error('❌ Scanner query error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: `Scanner "${scannerId}" not found` });
    }

    res.json({
      success: true,
      scanner: results[0]
    });
  });
});

// CREATE new scanner location (Admin only)
router.post('/scanners', verifyToken, adminOnly, (req, res) => {
  const { scannerId, locationType, locationName, building, floor, campus, notes } = req.body;

  // Validation
  if (!scannerId || !locationType || !locationName) {
    return res.status(400).json({ 
      error: 'scannerId, locationType, and locationName are required' 
    });
  }

  // Validate location type
  const validTypes = ['cafeteria', 'library', 'classroom', 'gate', 'office'];
  if (!validTypes.includes(locationType.toLowerCase())) {
    return res.status(400).json({ 
      error: `Invalid locationType. Must be one of: ${validTypes.join(', ')}` 
    });
  }

  const query = `
    INSERT INTO scanner_locations 
    (scanner_id, location_type, location_name, building, floor, campus, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [scannerId, locationType.toLowerCase(), locationName, building || null, floor || null, campus || null, notes || null],
    (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: `Scanner "${scannerId}" already exists` });
        }
        console.error('❌ Insert scanner error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      res.status(201).json({
        success: true,
        message: 'Scanner location created successfully',
        scannerId,
        locationType: locationType.toLowerCase(),
        locationName
      });
    }
  );
});

// UPDATE scanner location (Admin only)
router.put('/scanners/:scannerId', verifyToken, adminOnly, (req, res) => {
  const { scannerId } = req.params;
  const { locationType, locationName, building, floor, campus, isActive, notes } = req.body;

  // Validate location type if provided
  if (locationType) {
    const validTypes = ['cafeteria', 'library', 'classroom', 'gate', 'office'];
    if (!validTypes.includes(locationType.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid locationType. Must be one of: ${validTypes.join(', ')}` 
      });
    }
  }

  const query = `
    UPDATE scanner_locations
    SET 
      location_type = COALESCE(?, location_type),
      location_name = COALESCE(?, location_name),
      building = COALESCE(?, building),
      floor = COALESCE(?, floor),
      campus = COALESCE(?, campus),
      is_active = IF(? IS NOT NULL, ?, is_active),
      notes = COALESCE(?, notes),
      updated_at = NOW()
    WHERE scanner_id = ?
  `;

  db.query(
    query,
    [
      locationType ? locationType.toLowerCase() : null,
      locationName || null,
      building || null,
      floor || null,
      campus || null,
      isActive !== undefined ? isActive : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      notes || null,
      scannerId
    ],
    (err, results) => {
      if (err) {
        console.error('❌ Update scanner error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: `Scanner "${scannerId}" not found` });
      }

      res.json({
        success: true,
        message: 'Scanner location updated successfully',
        scannerId
      });
    }
  );
});

// DELETE scanner location (Admin only)
router.delete('/scanners/:scannerId', verifyToken, adminOnly, (req, res) => {
  const { scannerId } = req.params;

  const query = `
    DELETE FROM scanner_locations
    WHERE scanner_id = ?
  `;

  db.query(query, [scannerId], (err, results) => {
    if (err) {
      console.error('❌ Delete scanner error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: `Scanner "${scannerId}" not found` });
    }

    res.json({
      success: true,
      message: 'Scanner location deleted successfully'
    });
  });
});

module.exports = router;
