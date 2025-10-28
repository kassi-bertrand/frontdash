#!/bin/bash

##############################################################################
# FrontDash Database Reset Script
# This script resets the database to demo-ready state WITHOUT redeployment
# Run this between Postman collection runs to clean up test data
##############################################################################

set -e  # Exit on any error

# Disable AWS CLI pager
export AWS_PAGER=""

echo "================================================"
echo "FrontDash Database Reset"
echo "================================================"

# Step 1: Check if database config exists
if [ ! -f "db-config.txt" ]; then
    echo "❌ Error: db-config.txt not found!"
    echo "This script requires an active deployment."
    exit 1
fi

if [ ! -f "ec2-config.txt" ]; then
    echo "❌ Error: ec2-config.txt not found!"
    echo "This script requires an active deployment."
    exit 1
fi

# Load configuration
source db-config.txt
source ec2-config.txt
echo "✓ Configuration loaded"

# Step 2: Create reset SQL script
echo ""
echo "Creating reset SQL script..."

cat > reset.sql << 'SQL_EOF'
-- ===================================================================
-- FrontDash Database Reset Script
-- Removes test data and resets sequences for repeatable demos
-- ===================================================================

BEGIN;

-- Delete test data created during demo (keep sample data)
DELETE FROM ORDER_ITEMS WHERE order_number LIKE 'ORD-2025%' AND order_number != 'ORD-20251028-TEST';
DELETE FROM ORDERS WHERE order_number LIKE 'ORD-2025%' AND order_number != 'ORD-20251028-TEST';
DELETE FROM RESTAURANT_OPERATING_HOURS WHERE restaurant_id > 1;
DELETE FROM MENU_ITEMS WHERE restaurant_id > 1;
DELETE FROM RESTAURANTS WHERE restaurant_id > 1;
DELETE FROM STAFF_MEMBERS WHERE staff_id > 1;
DELETE FROM ACCOUNT_LOGINS WHERE username NOT IN ('admin', 'staff_test', 'pizzapalace99');
DELETE FROM DRIVERS WHERE driver_id > 2;

-- Reset SERIAL sequences to known values
SELECT setval('restaurants_restaurant_id_seq', 1, true);
SELECT setval('menu_items_menu_item_id_seq', 3, true);
SELECT setval('staff_members_staff_id_seq', 1, true);
SELECT setval('drivers_driver_id_seq', 2, true);

COMMIT;

-- Verification
SELECT 'RESTAURANTS:' as info, COUNT(*) as count FROM RESTAURANTS;
SELECT 'MENU_ITEMS:' as info, COUNT(*) as count FROM MENU_ITEMS;
SELECT 'STAFF:' as info, COUNT(*) as count FROM STAFF_MEMBERS;
SELECT 'DRIVERS:' as info, COUNT(*) as count FROM DRIVERS;
SELECT 'ORDERS:' as info, COUNT(*) as count FROM ORDERS;
SQL_EOF

echo "✓ Reset script created"

# Step 3: Upload reset script to EC2 and execute
echo ""
echo "Uploading reset script to EC2..."

scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no reset.sql ubuntu@${PUBLIC_IP}:/home/ubuntu/

echo "✓ Script uploaded"

echo ""
echo "Executing reset on database..."

ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${PUBLIC_IP} << REMOTE_EOF
    source /home/ubuntu/frontdash-api/db-config.txt
    PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME -f /home/ubuntu/reset.sql
    rm /home/ubuntu/reset.sql
REMOTE_EOF

# Clean up local file
rm reset.sql

echo ""
echo "================================================"
echo "Database Reset Complete!"
echo "================================================"
echo ""
echo "Current database state:"
echo "  ✓ Pizza Palace (restaurant_id=1) - PRESERVED"
echo "  ✓ 3 menu items for Pizza Palace - PRESERVED"
echo "  ✓ 7 operating hours for Pizza Palace - PRESERVED"
echo "  ✓ Michael Williams (staff_id=1) - PRESERVED"
echo "  ✓ John Doe (driver_id=1) - PRESERVED"
echo "  ✓ Robert Martinez (driver_id=2) - PRESERVED"
echo "  ✓ Alice Johnson (loyalty member) - PRESERVED"
echo "  ✓ Test order (ORD-20251028-TEST) - PRESERVED"
echo "  ✓ Admin, staff_test, pizzapalace99 accounts - PRESERVED"
echo ""
echo "Next IDs will be:"
echo "  - restaurant_id: 2 (Burger Barn)"
echo "  - menu_item_id: 4 (Classic Burger)"
echo "  - staff_id: 2 (Jennifer Lee)"
echo "  - driver_id: 3 (Sarah Johnson)"
echo ""
echo "✅ Ready to run Postman collection again!"
echo "================================================"
