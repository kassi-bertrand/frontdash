#!/bin/bash

##############################################################################
# FrontDash Database Viewer
# Displays all table contents in a readable format
##############################################################################

set -e

# Check if configuration exists
if [ ! -f "db-config.txt" ]; then
    echo "❌ Error: db-config.txt not found!"
    exit 1
fi

if [ ! -f "ec2-config.txt" ]; then
    echo "❌ Error: ec2-config.txt not found!"
    exit 1
fi

# Load configuration
source db-config.txt
source ec2-config.txt

echo "================================================"
echo "FrontDash Database Contents"
echo "Snapshot: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
echo ""

# Display all table contents via SSH to EC2
ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${PUBLIC_IP} << 'REMOTE_EOF'
    source /home/ubuntu/frontdash-api/db-config.txt

    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'SQL_EOF'
\pset border 2

-- RESTAURANTS
SELECT '========================================' as divider;
SELECT '          RESTAURANTS TABLE            ' as header;
SELECT '========================================' as divider;
SELECT
    restaurant_id as id,
    restaurant_name as name,
    owner_name as owner,
    phone_number as phone,
    account_status as status
FROM RESTAURANTS
ORDER BY restaurant_id;

-- MENU ITEMS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '          MENU ITEMS TABLE             ' as header;
SELECT '========================================' as divider;
SELECT
    menu_item_id as id,
    restaurant_id as rest_id,
    item_name as name,
    '$' || item_price as price,
    availability_status as status
FROM MENU_ITEMS
ORDER BY restaurant_id, menu_item_id;

-- RESTAURANT OPERATING HOURS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '     RESTAURANT OPERATING HOURS        ' as header;
SELECT '========================================' as divider;
SELECT
    restaurant_id as rest_id,
    day_of_week as day,
    opening_time as opens,
    closing_time as closes,
    is_closed
FROM RESTAURANT_OPERATING_HOURS
ORDER BY restaurant_id, day_of_week;

-- STAFF MEMBERS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '          STAFF MEMBERS TABLE          ' as header;
SELECT '========================================' as divider;
SELECT
    staff_id as id,
    first_name || ' ' || last_name as name,
    username,
    account_status as status
FROM STAFF_MEMBERS
ORDER BY staff_id;

-- DRIVERS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '            DRIVERS TABLE              ' as header;
SELECT '========================================' as divider;
SELECT
    driver_id as id,
    driver_name as name,
    driver_status as status
FROM DRIVERS
ORDER BY driver_id;

-- LOYALTY MEMBERS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '        LOYALTY MEMBERS TABLE          ' as header;
SELECT '========================================' as divider;
SELECT
    loyalty_number as id,
    first_name || ' ' || last_name as name,
    phone_number as phone,
    loyalty_points as points
FROM LOYALTY_MEMBERS
ORDER BY loyalty_number;

-- ACCOUNT LOGINS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '        ACCOUNT LOGINS TABLE           ' as header;
SELECT '========================================' as divider;
SELECT
    username,
    account_role as role,
    account_state as state
FROM ACCOUNT_LOGINS
ORDER BY account_role, username;

-- ORDERS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '            ORDERS TABLE               ' as header;
SELECT '========================================' as divider;
SELECT
    order_number as order_num,
    restaurant_id as rest_id,
    delivery_contact_name as customer,
    order_status as status,
    '$' || grand_total as total,
    TO_CHAR(created_at, 'MM-DD HH24:MI') as created
FROM ORDERS
ORDER BY created_at DESC;

-- ORDER ITEMS
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '          ORDER ITEMS TABLE            ' as header;
SELECT '========================================' as divider;
SELECT
    order_item_id as id,
    order_number as order_num,
    menu_item_id as menu_id,
    item_name as name,
    quantity as qty,
    '$' || item_price as price
FROM ORDER_ITEMS
ORDER BY order_number, order_item_id;

-- Summary counts
SELECT '' as blank;
SELECT '========================================' as divider;
SELECT '            TABLE SUMMARY              ' as header;
SELECT '========================================' as divider;
SELECT 'Restaurants' as table_name, COUNT(*) as row_count FROM RESTAURANTS
UNION ALL
SELECT 'Menu Items', COUNT(*) FROM MENU_ITEMS
UNION ALL
SELECT 'Operating Hours', COUNT(*) FROM RESTAURANT_OPERATING_HOURS
UNION ALL
SELECT 'Staff Members', COUNT(*) FROM STAFF_MEMBERS
UNION ALL
SELECT 'Drivers', COUNT(*) FROM DRIVERS
UNION ALL
SELECT 'Loyalty Members', COUNT(*) FROM LOYALTY_MEMBERS
UNION ALL
SELECT 'Account Logins', COUNT(*) FROM ACCOUNT_LOGINS
UNION ALL
SELECT 'Orders', COUNT(*) FROM ORDERS
UNION ALL
SELECT 'Order Items', COUNT(*) FROM ORDER_ITEMS;

SQL_EOF
REMOTE_EOF

echo ""
echo "================================================"
echo "End of Database Contents"
echo "================================================"
