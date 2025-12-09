#!/bin/bash

##############################################################################
# FrontDash Database Setup Script
# This script creates an RDS PostgreSQL database and sets up all tables
##############################################################################

set -e  # Exit on any error

# Disable AWS CLI pager to prevent script from pausing
export AWS_PAGER=""

# Configuration Variables
DB_INSTANCE_IDENTIFIER="frontdash-db"
DB_NAME="frontdash"
DB_USERNAME="frontdash_admin"
DB_PASSWORD="FrontDash2025!"  # Change this for production!
DB_INSTANCE_CLASS="db.t3.micro"  # Free tier eligible
ALLOCATED_STORAGE=20  # GB
ENGINE="postgres"
ENGINE_VERSION="15.14"
REGION="us-east-1"  # Change to your preferred region

echo "================================================"
echo "FrontDash Database Setup"
echo "================================================"

# Step 1: Create a security group for the database
echo ""
echo "Step 1: Creating security group for RDS..."
DB_SG_ID=$(aws ec2 create-security-group \
    --group-name frontdash-db-sg \
    --description "Security group for FrontDash RDS database" \
    --region $REGION \
    --output text \
    --query 'GroupId')

echo "✓ Database security group created: $DB_SG_ID"

# Save the security group ID for later use
echo $DB_SG_ID > db-sg-id.txt

# Step 2: Create the RDS PostgreSQL instance
echo ""
echo "Step 2: Creating RDS PostgreSQL instance..."
echo "This may take 5-10 minutes. Please wait..."

aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --db-name $DB_NAME \
    --db-instance-class $DB_INSTANCE_CLASS \
    --engine $ENGINE \
    --engine-version $ENGINE_VERSION \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage $ALLOCATED_STORAGE \
    --vpc-security-group-ids $DB_SG_ID \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --region $REGION \
    --storage-encrypted

echo "✓ RDS instance creation initiated"

# Step 3: Wait for the database to become available
echo ""
echo "Step 3: Waiting for database to become available..."

aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --region $REGION

echo "✓ Database is now available!"

# Step 4: Get the database endpoint
echo ""
echo "Step 4: Retrieving database endpoint..."

DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_IDENTIFIER \
    --region $REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "✓ Database endpoint: $DB_ENDPOINT"

# Save database information to a config file
cat > db-config.txt << EOF
DB_HOST=$DB_ENDPOINT
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_SG_ID=$DB_SG_ID
EOF

echo "✓ Database configuration saved to db-config.txt"

# Step 5: Create SQL file with all table definitions
echo ""
echo "Step 5: Creating SQL schema file..."

cat > schema.sql << 'EOF'
-- ===================================================================
-- FrontDash Database Schema
-- ===================================================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- Table: ACCOUNT_LOGINS
-- Stores login credentials for all users (admin, staff, restaurants)
-- ===================================================================
CREATE TABLE ACCOUNT_LOGINS (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    account_role VARCHAR(20) NOT NULL CHECK (account_role IN ('ADMIN', 'STAFF', 'RESTAURANT')),
    account_state VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_state IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- ===================================================================
-- Table: STAFF_MEMBERS
-- Stores information about FrontDash staff members
-- ===================================================================
CREATE TABLE STAFF_MEMBERS (
    staff_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'INACTIVE')),
    is_first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES ACCOUNT_LOGINS(username) ON DELETE CASCADE
);

-- ===================================================================
-- Table: RESTAURANTS
-- Stores information about restaurants registered with FrontDash
-- ===================================================================
CREATE TABLE RESTAURANTS (
    restaurant_id SERIAL PRIMARY KEY,
    restaurant_name VARCHAR(200) NOT NULL UNIQUE,
    owner_name VARCHAR(200) NOT NULL,
    restaurant_image_url TEXT,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(10) NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (account_status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'WITHDRAWAL_PENDING', 'WITHDRAWN')),
    approved_at TIMESTAMP,
    username VARCHAR(50) NOT NULL UNIQUE,
    FOREIGN KEY (username) REFERENCES ACCOUNT_LOGINS(username) ON DELETE CASCADE
);

-- ===================================================================
-- Table: LOYALTY_MEMBERS
-- Stores information about customers enrolled in the loyalty program
-- ===================================================================
CREATE TABLE LOYALTY_MEMBERS (
    loyalty_number VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(10) NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    card_holder_name VARCHAR(200) NOT NULL,
    card_expiry VARCHAR(7) NOT NULL,
    card_cvv VARCHAR(4) NOT NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'INACTIVE')),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Table: DRIVERS
-- Stores information about delivery drivers
-- ===================================================================
CREATE TABLE DRIVERS (
    driver_id SERIAL PRIMARY KEY,
    driver_name VARCHAR(200) NOT NULL UNIQUE,
    driver_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (driver_status IN ('AVAILABLE', 'BUSY', 'OFFLINE')),
    hired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- Table: MENU_ITEMS
-- Stores menu items for each restaurant
-- ===================================================================
CREATE TABLE MENU_ITEMS (
    menu_item_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    item_image_url TEXT,
    item_price DECIMAL(10, 2) NOT NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE
);

-- ===================================================================
-- Table: RESTAURANT_OPERATING_HOURS
-- Stores operating hours for each restaurant
-- ===================================================================
CREATE TABLE RESTAURANT_OPERATING_HOURS (
    hours_id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    opening_time TIME,
    closing_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
    UNIQUE(restaurant_id, day_of_week)
);

-- ===================================================================
-- Table: ORDERS
-- Stores customer orders
-- ===================================================================
CREATE TABLE ORDERS (
    order_number VARCHAR(50) PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    loyalty_number VARCHAR(50),
    guest_phone VARCHAR(10),
    delivery_building_number VARCHAR(50) NOT NULL,
    delivery_street_name VARCHAR(255) NOT NULL,
    delivery_apartment VARCHAR(50),
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(2) NOT NULL,
    delivery_zip_code VARCHAR(10) NOT NULL,
    delivery_contact_name VARCHAR(200) NOT NULL,
    delivery_contact_phone VARCHAR(10) NOT NULL,
    subtotal_amount DECIMAL(10, 2) NOT NULL,
    service_charge DECIMAL(10, 2) NOT NULL,
    tip_amount DECIMAL(10, 2) DEFAULT 0,
    loyalty_discount DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(10, 2) NOT NULL,
    order_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    delivery_duration_minutes INTEGER,
    assigned_staff_id INTEGER,
    assigned_driver_id INTEGER,
    -- Payment info (masked - no full card number or CVV stored)
    card_type VARCHAR(20),
    card_last_four VARCHAR(4),
    card_display VARCHAR(19),
    cardholder_first_name VARCHAR(100),
    cardholder_last_name VARCHAR(100),
    card_expiry VARCHAR(7),
    -- Billing address
    billing_building VARCHAR(50),
    billing_street VARCHAR(255),
    billing_apartment VARCHAR(50),
    billing_city VARCHAR(100),
    billing_state VARCHAR(2),
    billing_zip VARCHAR(10),
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (loyalty_number) REFERENCES LOYALTY_MEMBERS(loyalty_number),
    FOREIGN KEY (assigned_staff_id) REFERENCES STAFF_MEMBERS(staff_id),
    FOREIGN KEY (assigned_driver_id) REFERENCES DRIVERS(driver_id)
);

-- ===================================================================
-- Table: ORDER_ITEMS
-- Stores individual items within each order
-- ===================================================================
CREATE TABLE ORDER_ITEMS (
    order_item_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    menu_item_id INTEGER NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    FOREIGN KEY (order_number) REFERENCES ORDERS(order_number) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES MENU_ITEMS(menu_item_id) ON DELETE CASCADE
);

-- ===================================================================
-- Indexes for better query performance
-- ===================================================================

CREATE INDEX idx_staff_username ON STAFF_MEMBERS(username);
CREATE INDEX idx_restaurant_username ON RESTAURANTS(username);
CREATE INDEX idx_restaurant_status ON RESTAURANTS(account_status);
CREATE INDEX idx_orders_restaurant ON ORDERS(restaurant_id);
CREATE INDEX idx_orders_loyalty ON ORDERS(loyalty_number);
CREATE INDEX idx_orders_status ON ORDERS(order_status);
CREATE INDEX idx_orders_created ON ORDERS(created_at);
CREATE INDEX idx_menu_items_restaurant ON MENU_ITEMS(restaurant_id);
CREATE INDEX idx_order_items_order ON ORDER_ITEMS(order_number);

-- ===================================================================
-- Insert default admin account
-- Username: admin
-- Password: admin123 (hashed using bcrypt with 10 salt rounds)
-- ===================================================================

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('admin', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'ADMIN', 'ACTIVE');

-- ===================================================================
-- Sample data for testing (optional - comment out if not needed)
-- ===================================================================

-- Insert a test driver
INSERT INTO DRIVERS (driver_name, driver_status)
VALUES ('John Doe', 'AVAILABLE');

-- Insert a test restaurant account
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('pizzapalace99', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'RESTAURANT', 'ACTIVE');

-- Insert a test restaurant (pre-approved for demos)
INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('Pizza Palace', 'John Smith', 'https://example.com/logo.png', 'contact@pizzapalace.com', '123 Main Street', 'Dallas', 'TX', '75201', '2145551234', 'APPROVED', CURRENT_TIMESTAMP, 'pizzapalace99');

-- Insert sample menu item for Pizza Palace (only if it doesn't already exist)
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
SELECT 1, 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 'https://example.com/margherita.jpg', 12.99, 'AVAILABLE'
WHERE NOT EXISTS (SELECT 1 FROM MENU_ITEMS WHERE restaurant_id = 1 AND item_name = 'Margherita Pizza');

-- Insert sample operating hours for Pizza Palace
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
VALUES
(1, 'MONDAY', '09:00:00', '22:00:00', false),
(1, 'TUESDAY', '09:00:00', '22:00:00', false),
(1, 'WEDNESDAY', '09:00:00', '22:00:00', false),
(1, 'THURSDAY', '09:00:00', '22:00:00', false),
(1, 'FRIDAY', '09:00:00', '23:00:00', false),
(1, 'SATURDAY', '10:00:00', '23:00:00', false),
(1, 'SUNDAY', '10:00:00', '21:00:00', false);

-- Insert a second test driver (Robert Martinez)
INSERT INTO DRIVERS (driver_name, driver_status)
VALUES ('Robert Martinez', 'AVAILABLE');

-- Insert a test loyalty member (LM-ABC12345)
INSERT INTO LOYALTY_MEMBERS (loyalty_number, first_name, last_name, email_address, phone_number, card_number, card_holder_name, card_expiry, card_cvv, loyalty_points)
VALUES ('LM-ABC12345', 'Alice', 'Johnson', 'alice@example.com', '2145551111', '4532123456789012', 'Alice Johnson', '12/26', '123', 150);

-- Insert a test staff account
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('staff_test', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'STAFF', 'ACTIVE');

-- Insert a test staff member
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Michael', 'Williams', 'staff_test', 'ACTIVE', false);

-- Insert a pre-existing test order (ORD-20251028-TEST)
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status)
VALUES ('ORD-20251028-TEST', 1, '2145559999', '789', 'Test Street', 'Dallas', 'TX', '75201', 'Test User', '2145559999', 25.98, 2.34, 5.00, 33.32, 'PENDING');

-- Insert order items for the test order (only if it doesn't already exist)
INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
SELECT 'ORD-20251028-TEST', 1, 'Margherita Pizza', 12.99, 2
WHERE NOT EXISTS (SELECT 1 FROM ORDER_ITEMS WHERE order_number = 'ORD-20251028-TEST' AND menu_item_id = 1);

-- ===================================================================
-- Professor's Test Data (from xlsx file)
-- ===================================================================

-- Restaurant 1: All Chicken Meals
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('allchickenmeals01', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'RESTAURANT', 'ACTIVE');

INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('All Chicken Meals', 'Laura Wimbleton', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400', 'contact@allchickenmeals.com', '234 Lake Street', 'Boston', 'MA', '02132', '6174783785', 'APPROVED', CURRENT_TIMESTAMP, 'allchickenmeals01');

-- Restaurant 2: Pizza Only
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('pizzaonly02', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'RESTAURANT', 'ACTIVE');

INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('Pizza Only', 'Russel Beverton', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 'contact@pizzaonly.com', '719 Hobatt Road', 'Chestnut Hill', 'MA', '02129', '8574772773', 'APPROVED', CURRENT_TIMESTAMP, 'pizzaonly02');

-- Restaurant 3: Best Burgers
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('bestburgers03', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'RESTAURANT', 'ACTIVE');

INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('Best Burgers', 'Eager Alloysis', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 'contact@bestburgers.com', '28093 Park Avenue', 'Newton Corner', 'MA', '02125', '7814670073', 'APPROVED', CURRENT_TIMESTAMP, 'bestburgers03');

-- All Chicken Meals hours (restaurant_id = 2)
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
(2, 'MONDAY', '09:00:00', '21:00:00', false),
(2, 'TUESDAY', '09:00:00', '21:00:00', false),
(2, 'WEDNESDAY', '09:00:00', '21:00:00', false),
(2, 'THURSDAY', '09:00:00', '21:00:00', false),
(2, 'FRIDAY', '09:00:00', '21:00:00', false),
(2, 'SATURDAY', '08:00:00', '22:00:00', false),
(2, 'SUNDAY', '08:00:00', '22:00:00', false);

-- Pizza Only hours (restaurant_id = 3, closed Friday)
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
(3, 'MONDAY', '12:00:00', '00:00:00', false),
(3, 'TUESDAY', '12:00:00', '00:00:00', false),
(3, 'WEDNESDAY', '12:00:00', '00:00:00', false),
(3, 'THURSDAY', '12:00:00', '00:00:00', false),
(3, 'FRIDAY', '00:00:00', '00:00:00', true),
(3, 'SATURDAY', '10:00:00', '00:00:00', false),
(3, 'SUNDAY', '10:00:00', '00:00:00', false);

-- Best Burgers hours (restaurant_id = 4, closed Thu/Sat/Sun)
INSERT INTO RESTAURANT_OPERATING_HOURS (restaurant_id, day_of_week, opening_time, closing_time, is_closed) VALUES
(4, 'MONDAY', '09:00:00', '00:00:00', false),
(4, 'TUESDAY', '09:00:00', '00:00:00', false),
(4, 'WEDNESDAY', '09:00:00', '00:00:00', false),
(4, 'THURSDAY', '00:00:00', '00:00:00', true),
(4, 'FRIDAY', '09:00:00', '00:00:00', false),
(4, 'SATURDAY', '00:00:00', '00:00:00', true),
(4, 'SUNDAY', '00:00:00', '00:00:00', true);

-- All Chicken Meals menu (restaurant_id = 2)
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status) VALUES
(2, 'Nuggets', 'Crispy chicken nuggets', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400', 5.99, 'AVAILABLE'),
(2, 'Wings', 'Classic buffalo wings', 'https://images.unsplash.com/photo-1608039829572-9b0189c6cd52?w=400', 10.99, 'AVAILABLE'),
(2, 'Combo', 'Chicken combo meal', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400', 23.99, 'AVAILABLE'),
(2, 'Sandwich', 'Chicken sandwich', 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', 8.99, 'AVAILABLE'),
(2, 'Wrap', 'Chicken wrap', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', 6.99, 'AVAILABLE');

-- Pizza Only menu (restaurant_id = 3)
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status) VALUES
(3, 'Pepperoni(Small)', 'Small pepperoni pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 12.99, 'AVAILABLE'),
(3, 'Pepperoni(Large)', 'Large pepperoni pizza', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 17.99, 'AVAILABLE'),
(3, 'Supreme', 'Supreme pizza with all toppings', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 21.99, 'AVAILABLE'),
(3, 'Hawaiian', 'Hawaiian pizza with ham and pineapple', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 24.99, 'AVAILABLE'),
(3, 'Your 3 topping', 'Build your own 3-topping pizza', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', 15.99, 'AVAILABLE');

-- Best Burgers menu (restaurant_id = 4)
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status) VALUES
(4, 'Butter burger', 'Classic butter burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 9.99, 'AVAILABLE'),
(4, 'Cheese Burger', 'Classic cheeseburger', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400', 5.99, 'AVAILABLE'),
(4, 'Hamburger', 'Classic hamburger', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400', 4.99, 'AVAILABLE'),
(4, 'BBSpecial', 'Best Burgers special', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', 12.99, 'AVAILABLE'),
(4, 'BBDouble', 'Double burger special', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400', 11.99, 'AVAILABLE');

-- Drivers (7 total)
INSERT INTO DRIVERS (driver_name, driver_status) VALUES
('Shawn Murray', 'AVAILABLE'),
('Alex Shopper', 'AVAILABLE'),
('Lisa Graham', 'OFFLINE'),
('Ryan Graham', 'AVAILABLE'),
('Marcus Shane', 'AVAILABLE'),
('Vicky Kissinger', 'AVAILABLE'),
('Lucy Gordon', 'OFFLINE');

-- Staff members (5 total)
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state) VALUES
('richard01', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'STAFF', 'ACTIVE'),
('cox02', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'STAFF', 'ACTIVE'),
('deckon03', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'STAFF', 'ACTIVE'),
('cox04', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'STAFF', 'ACTIVE'),
('mullard05', '$2b$10$pJ1Wtw30i/FpDDxDgZ0/8.aGEhk6Ifq04rqRzo2NB5X0t2gBHrO1C', 'STAFF', 'ACTIVE');

INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login) VALUES
('Amanda', 'Richard', 'richard01', 'ACTIVE', false),
('Arthur', 'Cox', 'cox02', 'ACTIVE', false),
('Charles', 'Deckon', 'deckon03', 'ACTIVE', false),
('Francis', 'Cox', 'cox04', 'ACTIVE', false),
('Sarah', 'Mullard', 'mullard05', 'ACTIVE', false);

-- Completed Orders
-- FD0001: Martha Washington, 3 Sandwiches
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0001', 2, '6174785869', '77', 'Langley Road', 'Brighton', 'MA', '02239', 'Martha Washington', '6174785869', 26.97, 2.23, 3.00, 32.20, 'DELIVERED', '2025-11-30 17:32:00', '2025-11-30 18:07:00', '2025-11-30 18:10:00', 3, 'VISA', '0910', '****-****-****-0910', 'Martha', 'Washington', '06/28', '77', 'Langley Road', 'Brighton', 'MA', '02239');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
VALUES ('FD0001', 5, 'Sandwich', 8.99, 3);

-- FD0002: Raven Clinch, 10 Nuggets
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0002', 2, '6177074682', '361', 'Stuart Road', 'College Town', 'MA', '02129', 'Raven Clinch', '6177074682', 59.90, 4.94, 5.00, 69.84, 'DELIVERED', '2025-11-30 21:21:00', '2025-11-30 22:06:00', '2025-11-30 22:32:00', 4, 'MasterCard', '6899', '****-****-****-6899', 'Clemson', 'Clinch', '02/26', '890', 'Nathan Road', 'Burgundy', 'MA', '02189');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
VALUES ('FD0002', 2, 'Nuggets', 5.99, 10);

-- FD0003: Brian Anderson, multi-item (1 Sandwich, 1 Nuggets, 2 Wrap)
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0003', 2, '3396880896', '45', 'Everett Street', 'Chestnut Hill', 'MA', '02129', 'Brian Anderson', '3396880896', 28.96, 2.39, 2.90, 34.25, 'DELIVERED', '2025-11-30 12:41:00', '2025-11-30 12:53:00', '2025-11-30 12:51:00', 3, 'Discover', '5944', '****-****-****-5944', 'Brian', 'Anderson', '09/27', '45', 'Everett Street', 'Chestnut Hill', 'MA', '02129');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity) VALUES
('FD0003', 5, 'Sandwich', 8.99, 1),
('FD0003', 2, 'Nuggets', 5.99, 1),
('FD0003', 6, 'Wrap', 6.99, 2);

-- FD0004: Elaine Mikowsky, large order (10 Sandwich, 10 Wrap, 10 Combo)
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, estimated_delivery_time, actual_delivery_time, assigned_driver_id, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0004', 2, '8574780267', '82564', 'Breck Avenue', 'Brighton', 'MA', '02239', 'Elaine Mikowsky', '8574780267', 399.70, 32.98, 59.96, 492.64, 'DELIVERED', '2025-12-01 13:03:00', '2025-12-01 15:03:00', '2025-12-01 15:01:00', 5, 'VISA', '9689', '****-****-****-9689', 'Elaine', 'Mikowsky', '03/26', '82564', 'Breck Avenue', 'Brighton', 'MA', '02239');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity) VALUES
('FD0004', 5, 'Sandwich', 8.99, 10),
('FD0004', 6, 'Wrap', 6.99, 10),
('FD0004', 4, 'Combo', 23.99, 10);

-- Pending Orders
-- FD0108: Rachel Meyer, Hawaiian + Supreme from Pizza Only
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0108', 3, '8572731010', '75', 'Chatham Street', 'Longwood', 'MA', '02196', 'Rachel Meyer', '8572731010', 118.95, 9.81, 10.00, 138.76, 'PENDING', '2025-12-02 12:47:00', 'Discover', '1840', '****-****-****-1840', 'Rachel', 'Meyer', '09/26', '75', 'Chatham Street', 'Longwood', 'MA', '02196');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity) VALUES
('FD0108', 11, 'Hawaiian', 24.99, 3),
('FD0108', 10, 'Supreme', 21.99, 2);

-- FD0043: Fu Wang, Combo + Wrap from All Chicken Meals
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0043', 2, '6173577772', '2323', 'Brock Street', 'Central Village', 'MA', '02342', 'Fu Wang', '6173577772', 203.83, 16.82, 22.00, 242.65, 'PENDING', '2025-12-02 13:02:00', 'VISA', '0954', '****-****-****-0954', 'Mei', 'Wang', '02/27', '89946', 'Edgar Road', 'West Field', 'NY', '14775');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity) VALUES
('FD0043', 4, 'Combo', 23.99, 5),
('FD0043', 6, 'Wrap', 6.99, 12);

-- FD0044: Cliff Hans, 8 Sandwiches from All Chicken Meals
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0044', 2, '8572569863', '563', 'Davis Avenue', 'Brookline', 'MA', '02342', 'Cliff Hans', '8572569863', 71.92, 5.93, 3.60, 81.45, 'PENDING', '2025-12-02 13:13:00', 'VISA', '9696', '****-****-****-9696', 'Cliff', 'Hans', '04/27', '563', 'David Avenue', 'Brookline', 'MA', '02203');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
VALUES ('FD0044', 5, 'Sandwich', 8.99, 8);

-- FD0208: Graham Walter, BBSpecial + BBDouble + Cheese Burger from Best Burgers
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status, created_at, card_type, card_last_four, card_display, cardholder_first_name, cardholder_last_name, card_expiry, billing_building, billing_street, billing_city, billing_state, billing_zip)
VALUES ('FD0208', 4, '7814910166', '6256', 'Kent Street', 'Central Village', 'MA', '02342', 'Graham Walter', '7814910166', 213.82, 17.64, 32.07, 263.53, 'PENDING', '2025-12-02 13:54:00', 'Discover', '3795', '****-****-****-3795', 'Graham', 'Walter', '08/26', '6256', 'Kent Street', 'Central Village', 'MA', '02342');

INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity) VALUES
('FD0208', 16, 'BBSpecial', 12.99, 10),
('FD0208', 17, 'BBDouble', 11.99, 6),
('FD0208', 14, 'Cheese Burger', 5.99, 2);

COMMIT;

-- ===================================================================
-- End of schema
-- ===================================================================
EOF

echo "✓ Schema file created: schema.sql"

echo ""
echo "================================================"
echo "Database setup complete!"
echo "================================================"
echo ""
echo "Database Details:"
echo "  Host: $DB_ENDPOINT"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USERNAME"
echo ""
echo "IMPORTANT: Your database is now running and will incur charges."
echo "Configuration saved to: db-config.txt"
echo ""
echo "Next Steps:"
echo "  1. Run setup-ec2.sh to create the EC2 instance"
echo "  2. The schema will be automatically applied when EC2 connects"
echo "================================================"