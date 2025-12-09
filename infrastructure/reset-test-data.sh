#!/bin/bash

# ===================================================================
# FrontDash - Reset Test Data Script
# ===================================================================
# This script resets the database to a clean state with professor's
# test data. Use this for quick testing without redeploying.
#
# Usage:
#   ./reset-test-data.sh          # Insert test data (keeps existing)
#   ./reset-test-data.sh --clean  # Truncate all tables first
#
# Prerequisites:
#   - Database must be running (deploy-all.sh already executed)
#   - db-config.txt must exist with connection details
# ===================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/db-config.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
CLEAN_MODE=false
if [[ "$1" == "--clean" ]]; then
    CLEAN_MODE=true
fi

echo "================================================"
echo "FrontDash - Reset Test Data"
echo "================================================"
echo ""

# Check for config file
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}Error: db-config.txt not found!${NC}"
    echo "Run deploy-all.sh first to set up the database."
    exit 1
fi

# Read database configuration
echo "Reading database configuration..."
DB_ENDPOINT=$(grep "DB_ENDPOINT=" "$CONFIG_FILE" | cut -d'=' -f2)
DB_NAME=$(grep "DB_NAME=" "$CONFIG_FILE" | cut -d'=' -f2)
DB_USERNAME=$(grep "DB_USERNAME=" "$CONFIG_FILE" | cut -d'=' -f2)
DB_PASSWORD=$(grep "DB_PASSWORD=" "$CONFIG_FILE" | cut -d'=' -f2)

if [[ -z "$DB_ENDPOINT" || -z "$DB_NAME" || -z "$DB_USERNAME" || -z "$DB_PASSWORD" ]]; then
    echo -e "${RED}Error: Invalid db-config.txt format${NC}"
    exit 1
fi

echo "  Host: $DB_ENDPOINT"
echo "  Database: $DB_NAME"
echo ""

# Set password for psql
export PGPASSWORD="$DB_PASSWORD"

# Test connection
echo "Testing database connection..."
if ! psql -h "$DB_ENDPOINT" -U "$DB_USERNAME" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Make sure the database is running and accessible."
    exit 1
fi
echo -e "${GREEN}Connection successful!${NC}"
echo ""

# Clean mode - truncate all tables
if [[ "$CLEAN_MODE" == true ]]; then
    echo -e "${YELLOW}Clean mode: Truncating all tables...${NC}"
    psql -h "$DB_ENDPOINT" -U "$DB_USERNAME" -d "$DB_NAME" << 'TRUNCATE_SQL'
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate tables in correct order (respecting dependencies)
TRUNCATE TABLE ORDER_ITEMS CASCADE;
TRUNCATE TABLE ORDERS CASCADE;
TRUNCATE TABLE MENU_ITEMS CASCADE;
TRUNCATE TABLE RESTAURANT_OPERATING_HOURS CASCADE;
TRUNCATE TABLE RESTAURANTS CASCADE;
TRUNCATE TABLE DRIVERS CASCADE;
TRUNCATE TABLE STAFF_MEMBERS CASCADE;
TRUNCATE TABLE LOYALTY_MEMBERS CASCADE;
-- Keep ACCOUNT_LOGINS admin account, delete others
DELETE FROM ACCOUNT_LOGINS WHERE username != 'admin';

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reset sequences
ALTER SEQUENCE restaurants_restaurant_id_seq RESTART WITH 1;
ALTER SEQUENCE drivers_driver_id_seq RESTART WITH 1;
ALTER SEQUENCE staff_members_staff_id_seq RESTART WITH 1;
ALTER SEQUENCE menu_items_menu_item_id_seq RESTART WITH 1;
ALTER SEQUENCE restaurant_operating_hours_hours_id_seq RESTART WITH 1;
ALTER SEQUENCE order_items_order_item_id_seq RESTART WITH 1;

TRUNCATE_SQL
    echo -e "${GREEN}Tables truncated!${NC}"
    echo ""
fi

echo "Inserting professor's test data..."

psql -h "$DB_ENDPOINT" -U "$DB_USERNAME" -d "$DB_NAME" << 'TEST_DATA_SQL'
-- ===================================================================
-- Professor's Test Data from xlsx file
-- ===================================================================

BEGIN;

-- Same bcrypt hash as admin password (Admin123)
-- $2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO

-- ===================================================================
-- RESTAURANTS (3 restaurants)
-- ===================================================================

-- Restaurant 1: All Chicken Meals
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('allchickenmeals01', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'RESTAURANT', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('All Chicken Meals', 'Laura Wimbleton', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400', 'contact@allchickenmeals.com', '234 Lake Street', 'Boston', 'MA', '02132', '6174783785', 'APPROVED', CURRENT_TIMESTAMP, 'allchickenmeals01')
ON CONFLICT (restaurant_name) DO NOTHING;

-- Restaurant 2: Pizza Only
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('pizzaonly02', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'RESTAURANT', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('Pizza Only', 'Russel Beverton', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 'contact@pizzaonly.com', '719 Hobatt Road', 'Chestnut Hill', 'MA', '02129', '8574772773', 'APPROVED', CURRENT_TIMESTAMP, 'pizzaonly02')
ON CONFLICT (restaurant_name) DO NOTHING;

-- Restaurant 3: Best Burgers
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('bestburgers03', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'RESTAURANT', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('Best Burgers', 'Eager Alloysis', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 'contact@bestburgers.com', '28093 Park Avenue', 'Newton Corner', 'MA', '02125', '7814670073', 'APPROVED', CURRENT_TIMESTAMP, 'bestburgers03')
ON CONFLICT (restaurant_name) DO NOTHING;

-- ===================================================================
-- RESTAURANT OPERATING HOURS
-- ===================================================================

-- All Chicken Meals hours (9AM-9PM weekdays, 8AM-10PM weekends)
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, day, open_time::TIME, close_time::TIME, false
FROM RESTAURANTS r
CROSS JOIN (VALUES
    ('MONDAY', '09:00:00', '21:00:00'),
    ('TUESDAY', '09:00:00', '21:00:00'),
    ('WEDNESDAY', '09:00:00', '21:00:00'),
    ('THURSDAY', '09:00:00', '21:00:00'),
    ('FRIDAY', '09:00:00', '21:00:00'),
    ('SATURDAY', '08:00:00', '22:00:00'),
    ('SUNDAY', '08:00:00', '22:00:00')
) AS hours(day, open_time, close_time)
WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Pizza Only hours (12PM-12AM, closed Friday)
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'MONDAY', '12:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'TUESDAY', '12:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'WEDNESDAY', '12:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'THURSDAY', '12:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'FRIDAY', '00:00:00'::TIME, '00:00:00'::TIME, true FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'SATURDAY', '10:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'SUNDAY', '10:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Best Burgers hours (9AM-12AM, closed Thu/Sat/Sun)
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'MONDAY', '09:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'TUESDAY', '09:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'WEDNESDAY', '09:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'THURSDAY', '00:00:00'::TIME, '00:00:00'::TIME, true FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'FRIDAY', '09:00:00'::TIME, '00:00:00'::TIME, false FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'SATURDAY', '00:00:00'::TIME, '00:00:00'::TIME, true FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT r.restaurant_id, 'SUNDAY', '00:00:00'::TIME, '00:00:00'::TIME, true FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- ===================================================================
-- MENU ITEMS (5 items per restaurant = 15 total)
-- ===================================================================

-- All Chicken Meals menu
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Nuggets', 'Crispy chicken nuggets', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400', 5.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Wings', 'Classic buffalo wings', 'https://images.unsplash.com/photo-1608039829572-9b0189c6cd52?w=400', 10.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Combo', 'Chicken combo meal', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400', 23.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Sandwich', 'Chicken sandwich', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', 8.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Wrap', 'Chicken wrap', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', 6.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT DO NOTHING;

-- Pizza Only menu
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Pepperoni(Small)', 'Small pepperoni pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 12.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Pepperoni(Large)', 'Large pepperoni pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 17.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Supreme', 'Supreme pizza with all toppings', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 21.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Hawaiian', 'Hawaiian pizza with ham and pineapple', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 24.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Your 3 topping', 'Build your own 3-topping pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 15.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT DO NOTHING;

-- Best Burgers menu
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Butter burger', 'Classic butter burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 9.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Cheese Burger', 'Classic cheeseburger', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400', 5.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'Hamburger', 'Classic hamburger', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', 4.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'BBSpecial', 'Best Burgers special', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', 12.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT DO NOTHING;

INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT r.restaurant_id, 'BBDouble', 'Double burger special', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400', 11.99, 'AVAILABLE'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT DO NOTHING;

-- ===================================================================
-- DRIVERS (7 drivers)
-- ===================================================================

INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Shawn Murray', 'AVAILABLE') ON CONFLICT (driver_name) DO NOTHING;
INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Alex Shopper', 'AVAILABLE') ON CONFLICT (driver_name) DO NOTHING;
INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Lisa Graham', 'OFFLINE') ON CONFLICT (driver_name) DO NOTHING;
INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Ryan Graham', 'AVAILABLE') ON CONFLICT (driver_name) DO NOTHING;
INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Marcus Shane', 'AVAILABLE') ON CONFLICT (driver_name) DO NOTHING;
INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Vicky Kissinger', 'AVAILABLE') ON CONFLICT (driver_name) DO NOTHING;
INSERT INTO DRIVERS (driver_name, driver_status) VALUES ('Lucy Gordon', 'OFFLINE') ON CONFLICT (driver_name) DO NOTHING;

-- ===================================================================
-- STAFF MEMBERS (5 staff)
-- ===================================================================

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('richard01', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'STAFF', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Amanda', 'Richard', 'richard01', 'ACTIVE', false)
ON CONFLICT (username) DO NOTHING;

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('cox02', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'STAFF', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Arthur', 'Cox', 'cox02', 'ACTIVE', false)
ON CONFLICT (username) DO NOTHING;

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('deckon03', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'STAFF', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Charles', 'Deckon', 'deckon03', 'ACTIVE', false)
ON CONFLICT (username) DO NOTHING;

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('cox04', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'STAFF', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Francis', 'Cox', 'cox04', 'ACTIVE', false)
ON CONFLICT (username) DO NOTHING;

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('mullard05', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'STAFF', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Sarah', 'Mullard', 'mullard05', 'ACTIVE', false)
ON CONFLICT (username) DO NOTHING;

-- ===================================================================
-- COMPLETED ORDERS (from xlsx OrdersCompleted sheet)
-- Note: Card numbers stored as last 4 digits only for security
-- ===================================================================

-- Order FD0001: Martha Washington, 3 Sandwiches from All Chicken Meals
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0001', r.restaurant_id, '6174785869',
    '77', 'Langley Road', 'Brighton', 'MA', '02239',
    'Martha Washington', '6174785869',
    26.97, 2.23, 3.00, 32.20,
    'DELIVERED', '2025-11-30 17:32:00', '2025-11-30 18:07:00', '2025-11-30 18:10:00',
    (SELECT driver_id FROM DRIVERS WHERE driver_name = 'Shawn Murray'),
    'VISA', '0910', '****-****-****-0910', 'Martha', 'Washington', '06/28',
    '77', 'Langley Road', 'Brighton', 'MA', '02239'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (order_number) DO NOTHING;

-- Order items for FD0001
INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0001', m.menu_item_id, 'Sandwich', 8.99, 3
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Sandwich'
ON CONFLICT DO NOTHING;

-- Order FD0002: Raven Clinch, 10 Nuggets from All Chicken Meals
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0002', r.restaurant_id, '6177074682',
    '361', 'Stuart Road', 'College Town', 'MA', '02129',
    'Raven Clinch', '6177074682',
    59.90, 4.94, 5.00, 69.84,
    'DELIVERED', '2025-11-30 21:21:00', '2025-11-30 22:06:00', '2025-11-30 22:32:00',
    (SELECT driver_id FROM DRIVERS WHERE driver_name = 'Alex Shopper'),
    'MasterCard', '6899', '****-****-****-6899', 'Clemson', 'Clinch', '02/26',
    '890', 'Nathan Road', 'Burgundy', 'MA', '02189'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0002', m.menu_item_id, 'Nuggets', 5.99, 10
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Nuggets'
ON CONFLICT DO NOTHING;

-- Order FD0003: Brian Anderson, multi-item order (Sandwich, Nuggets, Wrap)
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0003', r.restaurant_id, '3396880896',
    '45', 'Everett Street', 'Chestnut Hill', 'MA', '02129',
    'Brian Anderson', '3396880896',
    28.96, 2.39, 2.90, 34.25,
    'DELIVERED', '2025-11-30 12:41:00', '2025-11-30 12:53:00', '2025-11-30 12:51:00',
    (SELECT driver_id FROM DRIVERS WHERE driver_name = 'Shawn Murray'),
    'Discover', '5944', '****-****-****-5944', 'Brian', 'Anderson', '09/27',
    '45', 'Everett Street', 'Chestnut Hill', 'MA', '02129'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0003', m.menu_item_id, 'Sandwich', 8.99, 1
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Sandwich'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0003', m.menu_item_id, 'Nuggets', 5.99, 1
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Nuggets'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0003', m.menu_item_id, 'Wrap', 6.99, 2
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Wrap'
ON CONFLICT DO NOTHING;

-- Order FD0004: Elaine Mikowsky, large order (10 Sandwich, 10 Wrap, 10 Combo)
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0004', r.restaurant_id, '8574780267',
    '82564', 'Breck Avenue', 'Brighton', 'MA', '02239',
    'Elaine Mikowsky', '8574780267',
    399.70, 32.98, 59.96, 492.64,
    'DELIVERED', '2025-12-01 13:03:00', '2025-12-01 15:03:00', '2025-12-01 15:01:00',
    (SELECT driver_id FROM DRIVERS WHERE driver_name = 'Lisa Graham'),
    'VISA', '9689', '****-****-****-9689', 'Elaine', 'Mikowsky', '03/26',
    '82564', 'Breck Avenue', 'Brighton', 'MA', '02239'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0004', m.menu_item_id, 'Sandwich', 8.99, 10
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Sandwich'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0004', m.menu_item_id, 'Wrap', 6.99, 10
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Wrap'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0004', m.menu_item_id, 'Combo', 23.99, 10
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Combo'
ON CONFLICT DO NOTHING;

-- ===================================================================
-- PENDING ORDERS (from xlsx Orders Pending sheet)
-- ===================================================================

-- Order FD0108: Rachel Meyer, Hawaiian + Supreme from Pizza Only
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0108', r.restaurant_id, '8572731010',
    '75', 'Chatham Street', 'Longwood', 'MA', '02196',
    'Rachel Meyer', '8572731010',
    118.95, 9.81, 10.00, 138.76,
    'PENDING', '2025-12-02 12:47:00',
    'Discover', '1840', '****-****-****-1840', 'Rachel', 'Meyer', '09/26',
    '75', 'Chatham Street', 'Longwood', 'MA', '02196'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Pizza Only'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0108', m.menu_item_id, 'Hawaiian', 24.99, 3
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'Pizza Only' AND m.item_name = 'Hawaiian'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0108', m.menu_item_id, 'Supreme', 21.99, 2
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'Pizza Only' AND m.item_name = 'Supreme'
ON CONFLICT DO NOTHING;

-- Order FD0043: Fu Wang, Combo + Wrap from All Chicken Meals
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0043', r.restaurant_id, '6173577772',
    '2323', 'Brock Street', 'Central Village', 'MA', '02342',
    'Fu Wang', '6173577772',
    203.83, 16.82, 22.00, 242.65,
    'PENDING', '2025-12-02 13:02:00',
    'VISA', '0954', '****-****-****-0954', 'Mei', 'Wang', '02/27',
    '89946', 'Edgar Road', 'West Field', 'NY', '14775'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0043', m.menu_item_id, 'Combo', 23.99, 5
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Combo'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0043', m.menu_item_id, 'Wrap', 6.99, 12
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Wrap'
ON CONFLICT DO NOTHING;

-- Order FD0044: Cliff Hans, 8 Sandwiches from All Chicken Meals
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0044', r.restaurant_id, '8572569863',
    '563', 'Davis Avenue', 'Brookline', 'MA', '02342',
    'Cliff Hans', '8572569863',
    71.92, 5.93, 3.60, 81.45,
    'PENDING', '2025-12-02 13:13:00',
    'VISA', '9696', '****-****-****-9696', 'Cliff', 'Hans', '04/27',
    '563', 'David Avenue', 'Brookline', 'MA', '02203'
FROM RESTAURANTS r WHERE r.restaurant_name = 'All Chicken Meals'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0044', m.menu_item_id, 'Sandwich', 8.99, 8
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'All Chicken Meals' AND m.item_name = 'Sandwich'
ON CONFLICT DO NOTHING;

-- Order FD0208: Graham Walter, BBSpecial + BBDouble + Cheese Burger from Best Burgers
INSERT INTO ORDERS (
    order_number, restaurant_id, guest_phone,
    delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code,
    delivery_contact_name, delivery_contact_phone,
    subtotal_amount, service_charge, tip_amount, grand_total,
    order_status, created_at,
    card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry,
    billing_building, billing_street, billing_city, billing_state, billing_zip
)
SELECT
    'FD0208', r.restaurant_id, '7814910166',
    '6256', 'Kent Street', 'Central Village', 'MA', '02342',
    'Graham Walter', '7814910166',
    213.82, 17.64, 32.07, 263.53,
    'PENDING', '2025-12-02 13:54:00',
    'Discover', '3795', '****-****-****-3795', 'Graham', 'Walter', '08/26',
    '6256', 'Kent Street', 'Central Village', 'MA', '02342'
FROM RESTAURANTS r WHERE r.restaurant_name = 'Best Burgers'
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0208', m.menu_item_id, 'BBSpecial', 12.99, 10
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'Best Burgers' AND m.item_name = 'BBSpecial'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0208', m.menu_item_id, 'BBDouble', 11.99, 6
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'Best Burgers' AND m.item_name = 'BBDouble'
ON CONFLICT DO NOTHING;

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'FD0208', m.menu_item_id, 'Cheese Burger', 5.99, 2
FROM MENU_ITEMS m JOIN RESTAURANTS r ON m.restaurant_id = r.restaurant_id
WHERE r.restaurant_name = 'Best Burgers' AND m.item_name = 'Cheese Burger'
ON CONFLICT DO NOTHING;

COMMIT;

TEST_DATA_SQL

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Test data inserted successfully!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Data inserted:"
echo "  - 3 Restaurants (All Chicken Meals, Pizza Only, Best Burgers)"
echo "  - 21 Restaurant operating hours entries"
echo "  - 15 Menu items (5 per restaurant)"
echo "  - 7 Drivers"
echo "  - 5 Staff members"
echo "  - 4 Completed orders"
echo "  - 4 Pending orders"
echo ""
echo "Test accounts (password: Admin123):"
echo "  - admin (Admin)"
echo "  - richard01, cox02, deckon03, cox04, mullard05 (Staff)"
echo "  - allchickenmeals01, pizzaonly02, bestburgers03 (Restaurants)"
echo ""
