#!/bin/bash

# =========================================================
# Cafeteria Attendance Dashboard - Quick Setup Script
# =========================================================

echo "🍽️  Cafeteria Attendance Dashboard - Setup"
echo "=========================================="
echo ""

# Check if database schema file exists
if [ ! -f "cafeteria_library_schema.sql" ]; then
    echo "❌ Error: cafeteria_library_schema.sql not found in current directory"
    echo "Make sure you're in the backend directory"
    exit 1
fi

echo "📋 Step 1: Running database schema migration..."
echo ""

# Run the schema migration
mysql -u root -p ambo_smart_card < cafeteria_library_schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema successfully installed!"
    echo ""
else
    echo ""
    echo "❌ Database migration failed. Check your MySQL connection."
    exit 1
fi

echo "📋 Step 2: Verifying tables created..."
echo ""

# Verify tables
mysql -u root -p ambo_smart_card -e "
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'ambo_smart_card' 
AND TABLE_NAME LIKE '%cafeteria%'
ORDER BY TABLE_NAME;
" 2>/dev/null

echo ""
echo "📋 Step 3: Checking meal times configuration..."
echo ""

mysql -u root -p ambo_smart_card -e "
SELECT meal_type, start_time, end_time, is_active 
FROM meal_times_config 
ORDER BY CASE 
  WHEN meal_type = 'breakfast' THEN 1
  WHEN meal_type = 'lunch' THEN 2
  WHEN meal_type = 'dinner' THEN 3
  ELSE 4
END;
" 2>/dev/null

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Restart the backend server: npm start"
echo "2. Access dashboard at: http://localhost:3000/cafeteria-attendance"
echo "3. Check console for: '✓ Cafeteria attendance routes registered'"
echo ""
