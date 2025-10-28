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
    account_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (account_status IN ('PENDING', 'APPROVED', 'SUSPENDED')),
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
    FOREIGN KEY (restaurant_id) REFERENCES RESTAURANTS(restaurant_id),
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
-- Password: Admin123 (hashed using bcrypt with 10 salt rounds)
-- ===================================================================

INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('admin', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'ADMIN', 'ACTIVE');

-- ===================================================================
-- Sample data for testing (optional - comment out if not needed)
-- ===================================================================

-- Insert a test driver
INSERT INTO DRIVERS (driver_name, driver_status)
VALUES ('John Doe', 'AVAILABLE');

-- Insert a test restaurant account
INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
VALUES ('pizzapalace99', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'RESTAURANT', 'ACTIVE');

-- Insert a test restaurant (pre-approved for demos)
INSERT INTO RESTAURANTS (restaurant_name, owner_name, restaurant_image_url, email_address, street_address, city, state, zip_code, phone_number, account_status, approved_at, username)
VALUES ('Pizza Palace', 'John Smith', 'https://example.com/logo.png', 'contact@pizzapalace.com', '123 Main Street', 'Dallas', 'TX', '75201', '2145551234', 'APPROVED', CURRENT_TIMESTAMP, 'pizzapalace99');

-- Insert sample menu items for Pizza Palace (restaurant_id will be 1)
INSERT INTO MENU_ITEMS (restaurant_id, item_name, item_description, item_image_url, item_price, availability_status)
VALUES
(1, 'Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 'https://example.com/margherita.jpg', 12.99, 'AVAILABLE'),
(1, 'Pepperoni Pizza', 'Traditional pepperoni with mozzarella cheese', 'https://example.com/pepperoni.jpg', 14.99, 'AVAILABLE'),
(1, 'Veggie Supreme', 'Loaded with fresh vegetables and cheese', 'https://example.com/veggie.jpg', 13.99, 'AVAILABLE');

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
VALUES ('staff_test', '$2b$10$m.TPdVbsBev924ktt7R32uEVaTeaC0dZd7LocpQYkLCj2L9w6IAUO', 'STAFF', 'ACTIVE');

-- Insert a test staff member
INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
VALUES ('Michael', 'Williams', 'staff_test', 'ACTIVE', false);

-- Insert a pre-existing test order (ORD-20251028-TEST)
INSERT INTO ORDERS (order_number, restaurant_id, guest_phone, delivery_building_number, delivery_street_name, delivery_city, delivery_state, delivery_zip_code, delivery_contact_name, delivery_contact_phone, subtotal_amount, service_charge, tip_amount, grand_total, order_status)
VALUES ('ORD-20251028-TEST', 1, '2145559999', '789', 'Test Street', 'Dallas', 'TX', '75201', 'Test User', '2145559999', 25.98, 2.34, 5.00, 33.32, 'PENDING');

-- Insert order items for the test order
INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
VALUES
('ORD-20251028-TEST', 1, 'Margherita Pizza', 12.99, 2);

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