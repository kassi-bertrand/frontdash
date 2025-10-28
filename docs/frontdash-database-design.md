# FrontDash Database Design Document

## Executive Summary

This document presents the complete database design for the FrontDash food delivery web application. The design supports a three-sided marketplace connecting restaurants, customers, and delivery operations through status-driven workflows with role-based access control.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Database Architecture](#database-architecture)
3. [Entity Identification](#entity-identification)
4. [Detailed Table Schemas](#detailed-table-schemas)
5. [Entity Relationship Diagrams](#entity-relationship-diagrams)
6. [Relationship Documentation](#relationship-documentation)
7. [Security Implementation](#security-implementation)
8. [Bonus Features Integration](#bonus-features-integration)
9. [Constraints and Business Rules](#constraints-and-business-rules)

## Project Overview

FrontDash is a comprehensive food delivery platform facilitating connections between restaurants and customers through efficient delivery services. The system manages restaurant registration and menu operations, customer ordering processes, and administrative oversight through independent yet interconnected components.

### Key Stakeholders
- **Restaurants**: Register, manage menus, operating hours, and order fulfillment
- **Customers**: Browse restaurants, place orders without account requirements
- **FrontDash Staff**: Process orders, coordinate deliveries, track performance metrics
- **FrontDash Administrators**: Manage platform operations, approve registrations, oversee staff
- **Drivers**: Execute deliveries and report completion metrics

### Core Business Requirements
- Status-driven processing for registrations, withdrawals, and orders
- Independent component operation with concurrent usage capability
- Real-time delivery time estimation and performance tracking
- Comprehensive audit trails and security implementation
- Optional customer loyalty program with points-based rewards

## Database Architecture

The database employs a relational model optimized for ACID compliance and concurrent operations. The design maintains normalized operational data while relying on status transitions within core tables for approvals and workflow progression.

### Design Principles
- **Normalization**: Tables normalized to 3NF to eliminate redundancy
- **Scalability**: Indexed foreign keys and optimized query patterns
- **Security**: Encrypted password storage and audit logging
- **Flexibility**: Extensible schema for future feature additions
- **Performance**: Strategic denormalization for frequently accessed data

## Entity Identification

### Core Entities
1. **Account Logins** - Unified authentication for admin, staff, and restaurant accounts
2. **Restaurants** - Primary business partners with complete profile management
3. **Restaurant Operating Hours** - Business hours configuration per day of week
4. **Menu Items** - Individual food offerings with availability and pricing
5. **Orders** - Customer purchase transactions with complete audit trails
6. **Order Items** - Junction entity linking orders to specific menu items
7. **Loyalty Members** - Optional accounts for loyalty program participation
8. **Staff Accounts** - FrontDash employees processing orders and operations
9. **Drivers** - Delivery personnel executing order fulfillment

## Detailed Table Schemas

### 1. Restaurants Table

```sql
CREATE TABLE restaurants (
    restaurant_id SERIAL PRIMARY KEY,
    restaurant_name VARCHAR(255) NOT NULL UNIQUE,
    owner_name VARCHAR(255) NOT NULL,
    restaurant_image_url VARCHAR(500),
    email_address VARCHAR(255) NOT NULL UNIQUE,
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(10) NOT NULL,
    account_status ENUM('PENDING', 'APPROVED', 'SUSPENDED') DEFAULT 'PENDING',
    approved_at TIMESTAMP NULL,
    username VARCHAR(100) REFERENCES account_logins(username),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Business Rules**:
- Restaurant names must be unique across the platform
- Owner name identifies the contact person for the restaurant
- Phone numbers validated as 10 digits with first digit non-zero
- Email addresses must be unique and properly formatted
- Account status tracks the restaurant's current platform standing (PENDING, APPROVED, SUSPENDED)

### 2. Restaurant Operating Hours Table

```sql
CREATE TABLE restaurant_operating_hours (
    hours_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    day_of_week ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    opening_time TIME,
    closing_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, day_of_week)
);
```

**Business Rules**:
- Each restaurant must have exactly seven records (one per day)
- Opening and closing times can be NULL if restaurant is closed that day
- Times stored in 24-hour format for consistency

### 3. Menu Items Table

```sql
CREATE TABLE menu_items (
    item_id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    item_image_url VARCHAR(500),
    item_price DECIMAL(10,2) NOT NULL CHECK (item_price > 0),
    availability_status ENUM('AVAILABLE', 'UNAVAILABLE') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_restaurant_availability (restaurant_id, availability_status)
);
```

**Business Rules**:
- Item prices must be positive values
- Item names must be provided for all menu items
- Availability status controls customer visibility

### 4. Loyalty Members Table (Bonus Feature)

```sql
CREATE TABLE loyalty_members (
    loyalty_number VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(10) NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    card_holder_name VARCHAR(100) NOT NULL,
    card_expiry VARCHAR(5) NOT NULL,
    card_cvv VARCHAR(4) NOT NULL,
    account_status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Business Rules**:
- Loyalty number is the primary key and system-generated unique identifier
- Credit card information is stored directly (card_number, card_holder_name, card_expiry, card_cvv)
- Card CVV must be encrypted at rest
- Card expiry stored in MM/YY format
- Loyalty points cannot be negative
- Loyalty members authenticate using their loyalty number only; no application login is created

### 5. Account Logins Table

```sql
CREATE TABLE account_logins (
    username VARCHAR(100) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    account_role ENUM('ADMIN', 'STAFF', 'RESTAURANT') NOT NULL,
    account_state ENUM('ACTIVE', 'INACTIVE', 'LOCKED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);
```

**Business Rules**:
- Username is the primary key and unique login identifier
- Password hashes are stored using bcrypt (minimum 12 rounds)
- Account role includes ADMIN, STAFF, and RESTAURANT users
- Account state controls authentication availability (active, inactive, locked)

### 6. Orders Table

```sql
CREATE TABLE orders (
    order_number VARCHAR(20) PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(restaurant_id),
    loyalty_number VARCHAR(20) REFERENCES loyalty_members(loyalty_number),

    -- Guest Information (for non-loyalty customers)
    guest_phone VARCHAR(10),

    -- Delivery Information
    delivery_building_number VARCHAR(20) NOT NULL,
    delivery_street_name VARCHAR(255) NOT NULL,
    delivery_apartment VARCHAR(50),
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(50) NOT NULL,
    delivery_zip_code VARCHAR(10) NOT NULL,
    delivery_contact_name VARCHAR(100) NOT NULL,
    delivery_contact_phone VARCHAR(10) NOT NULL,

    -- Order Amounts
    subtotal_amount DECIMAL(10,2) NOT NULL CHECK (subtotal_amount > 0),
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    loyalty_discount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) NOT NULL CHECK (grand_total > 0),

    -- Order Status and Timing
    order_status ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    delivery_duration_minutes INT,

    -- Assignment and Processing
    assigned_staff_id INT REFERENCES staff_accounts(staff_id),
    assigned_driver_id INT REFERENCES drivers(driver_id),

    INDEX idx_order_status (order_status),
    INDEX idx_restaurant_date (restaurant_id, created_at),
    INDEX idx_staff_assignment (assigned_staff_id),
    INDEX idx_delivery_tracking (order_status, estimated_delivery_time)
);
```

**Business Rules**:
- Order number is the primary key and system-generated unique identifier
- Either loyalty_number OR guest_phone must be provided
- Delivery contact name and phone are required for all orders (identifies person ordering/receiving)
- Service charge calculated as 8.25% of subtotal
- Grand total must equal subtotal + service charge + tip - loyalty discount
- Loyalty discount is 0 if not a loyalty member
- Credit card verification occurs before order creation; no payment card data is stored in the orders table

### 7. Order Items Table

```sql
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL REFERENCES orders(order_number) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(menu_item_id),
    item_name VARCHAR(255) NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    INDEX idx_order_items (order_number)
);
```

**Business Rules**:
- Quantity must be positive
- Item name and price captured at order time for historical accuracy
- Subtotal calculated as item_price × quantity

### 8. Staff Accounts Table

```sql
CREATE TABLE staff_accounts (
    staff_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL REFERENCES account_logins(username),
    account_status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    is_first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (account_status)
);
```

**Business Rules**:
- Username references the account_logins table
- Username format: lastname + 2 digits (auto-generated)
- Initial password is auto-generated within account_logins and must be changed on first login
- Account status can be ACTIVE or INACTIVE

### 9. Drivers Table

```sql
CREATE TABLE drivers (
    driver_id SERIAL PRIMARY KEY,
    driver_name VARCHAR(100) NOT NULL UNIQUE,
    driver_status ENUM('AVAILABLE', 'BUSY', 'OFFLINE') DEFAULT 'AVAILABLE',
    hired_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_driver_status (driver_status)
);
```

**Business Rules**:
- Driver names must be unique
- Driver status tracks availability: AVAILABLE, BUSY, or OFFLINE
- Only one driver can be assigned to an order at a time
- Status tracking enables efficient order assignment


## Entity Relationship Diagrams

The complete FrontDash database design is presented in the following comprehensive entity relationship diagram showing all entities and their relationships.

```mermaid
erDiagram
ACCOUNT_LOGINS {
string username PK "Primary key, unique login identifier"
string password_hash
enum account_role "ADMIN, STAFF, RESTAURANT"
enum account_state "ACTIVE, INACTIVE, LOCKED"
timestamp created_at
timestamp last_login_at
}

STAFF_MEMBERS {
int staff_id PK
string first_name
string last_name
string username FK "Foreign key to ACCOUNT_LOGINS"
enum account_status "ACTIVE, INACTIVE"
boolean is_first_login
timestamp created_at
}

RESTAURANTS {
int restaurant_id PK
string restaurant_name UK
string owner_name "Contact person name"
string restaurant_image_url
string email_address UK
string street_address
string city
string state
string zip_code
string phone_number
enum account_status "PENDING, APPROVED, SUSPENDED"
timestamp approved_at
string username FK "Foreign key to ACCOUNT_LOGINS"
}

LOYALTY_MEMBERS {
string loyalty_number PK "Primary key, unique loyalty number"
string first_name
string last_name
string email_address UK
string phone_number
string card_number "Credit card number"
string card_holder_name
string card_expiry "MM/YY format"
string card_cvv "Encrypted"
enum account_status "ACTIVE, INACTIVE"
int loyalty_points "Default 0"
timestamp created_at
}

DRIVERS {
int driver_id PK
string driver_name UK
enum driver_status "AVAILABLE, BUSY, OFFLINE"
timestamp hired_date
}

ORDERS {
string order_number PK "Primary key, unique order identifier"
int restaurant_id FK
string loyalty_number FK "Nullable - for loyalty members only"
string guest_phone
string delivery_building_number
string delivery_street_name
string delivery_apartment
string delivery_city
string delivery_state
string delivery_zip_code
string delivery_contact_name "Name of person ordering/receiving (required for non-loyalty orders)"
string delivery_contact_phone "Phone of person ordering/receiving (required for non-loyalty orders)"
decimal subtotal_amount
decimal service_charge
decimal tip_amount
decimal loyalty_discount "0 if not a loyalty member"
decimal grand_total
enum order_status "PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED"
timestamp created_at
timestamp estimated_delivery_time
timestamp actual_delivery_time
int delivery_duration_minutes
int assigned_staff_id FK
int assigned_driver_id FK
}

MENU_ITEMS {
int menu_item_id PK
int restaurant_id FK
string item_name
string item_description
string item_image_url
decimal item_price
enum availability_status "AVAILABLE, UNAVAILABLE"
timestamp created_at
timestamp updated_at
}

ORDER_ITEMS {
int order_item_id PK
string order_number FK
int menu_item_id FK
string item_name "Snapshot at order time"
decimal item_price "Price at order time"
int quantity
}

RESTAURANT_OPERATING_HOURS {
int hours_id PK
int restaurant_id FK
enum day_of_week "MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY"
time opening_time
time closing_time
boolean is_closed "True if closed that day"
}

%% Relationships
ACCOUNT_LOGINS ||--o| STAFF_MEMBERS : "has"
ACCOUNT_LOGINS ||--o| RESTAURANTS : "has"
RESTAURANTS ||--o{ MENU_ITEMS : "offers"
RESTAURANTS ||--o{ RESTAURANT_OPERATING_HOURS : "schedules"
RESTAURANTS ||--o{ ORDERS : "receives"
LOYALTY_MEMBERS ||--o{ ORDERS : "places"
ORDERS ||--o{ ORDER_ITEMS : "contains"
MENU_ITEMS ||--o{ ORDER_ITEMS : "references"
STAFF_MEMBERS ||--o{ ORDERS : "processes"
DRIVERS ||--o{ ORDERS : "delivers"
```


## Relationship Documentation

### One-to-One Relationships

**Account Logins to Staff Members (1:1)**
- Each staff member has exactly one account login credential
- Username is the foreign key linking staff to their authentication credentials
- Account login stores password hash and authentication state

**Account Logins to Restaurants (1:1)**
- Each restaurant has exactly one account login credential
- Username is the foreign key linking restaurant to their authentication credentials
- Account login stores password hash and authentication state

### One-to-Many Relationships

**Restaurants to Restaurant Operating Hours (1:7)**
- Each restaurant must have exactly seven operating hour records (one per day of week)
- Cascade delete ensures hours are removed when restaurant is deleted
- Unique constraint prevents duplicate day entries per restaurant

**Restaurants to Menu Items (1:N)**
- Each restaurant can have unlimited menu items
- Menu items cannot exist without a restaurant
- Availability status controls customer visibility

**Restaurants to Orders (1:N)**
- Each restaurant can receive unlimited orders
- Orders maintain restaurant reference for historical accuracy
- Foreign key constraint ensures order integrity

**Loyalty Members to Orders (1:N)**
- Each loyalty member can place multiple orders
- Orders reference loyalty members via loyalty_number
- Loyalty member reference is optional (supports guest checkout)
- Loyalty points calculated from order totals when a loyalty member is linked

**Orders to Order Items (1:N)**
- Each order contains one or more order items
- Order items reference orders via order_number (not auto-increment ID)
- Order items cannot exist independently
- Cascade delete maintains referential integrity

**Menu Items to Order Items (1:N)**
- Menu items can appear in multiple orders
- Order items capture menu item details at time of order
- Historical pricing preserved through snapshotting

**Staff Accounts to Orders (1:N)**
- Staff members can process multiple orders
- Order assignment tracked for performance metrics
- Optional relationship until a staff member claims the order and advances its status

**Drivers to Orders (1:N)**
- Drivers can deliver multiple orders
- Order assignment enables delivery tracking

### Operational Oversight

**System Administrator Responsibilities (outside the database schema)**
- Approves restaurant account changes; the resulting status is stored in `restaurants.account_status`
- Triggers staff credential creation within `account_logins` when new team members are added
- Oversees driver availability and deactivation while day-to-day operations remain with staff tools
- Reviews loyalty customer enrolments before activating their `account_status`

### Concurrency Control

**Transactional Status Updates**
Use row-level locks when multiple staff members may advance orders from `PENDING` to `CONFIRMED` so that a ticket is only claimed once.

```sql
BEGIN;
SELECT order_number
FROM orders
WHERE order_status = 'PENDING'
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;

UPDATE orders
SET order_status = 'CONFIRMED',
    assigned_staff_id = ?
WHERE order_number = ?;
COMMIT;
```

## Security Implementation

### Password Security

**Encryption Standards**
All passwords stored using bcrypt hashing with minimum 12 rounds for computational security.

```sql
-- Password never stored in plain text
password_hash VARCHAR(255) NOT NULL -- Stores bcrypt hash
```

**Password Requirements Enforcement**
- Minimum 6 characters length
- At least one uppercase letter
- At least one lowercase letter
- At least one numeric digit
- No password display in any user interface

### Data Protection

**Sensitive Information Encryption**
Credit card information for loyalty members is stored directly in the database with appropriate security measures:

```sql
card_number VARCHAR(16) NOT NULL      -- Credit card number
card_holder_name VARCHAR(100) NOT NULL
card_expiry VARCHAR(5) NOT NULL       -- MM/YY format
card_cvv VARCHAR(4) NOT NULL          -- Must be encrypted at rest
```

**Security Requirements**:
- Card CVV must be encrypted at rest using AES-256
- Card numbers should be encrypted or use database-level encryption
- Card expiry stored in MM/YY format for validation
- Credit card verification performed before storing credentials

**Personal Identifiable Information (PII) Handling**
- Email addresses unique across loyalty member and restaurant tables
- Phone numbers validated for proper format (10 digits)
- Credit card information stored only for loyalty members
- No card data stored in orders table (orders only reference loyalty_number)

### Access Control

**Role-Based Security**
- Administrators: Full system access
- Staff: Order processing and limited customer data access
- Restaurants: Own account and menu management only
- Customers: Own order history and loyalty account access

**Session Management**
User sessions tracked with secure token generation and automatic timeout policies.

## Bonus Features Integration

### Customer Loyalty Program

**Points Accumulation System**
- 1 point earned per dollar spent (calculated from subtotal before service charges and tips)
- Points automatically added upon order completion
- Points balance tracked in real-time

**Discount Redemption System**
- 10% discount available when customer has 100+ points
- 100 points automatically deducted upon discount application
- Discount amount recorded in orders table for audit purposes

**Customer Registration Workflow**
1. Customer submits registration through web form with credit card details
2. Credit card is verified for validity
3. Registration is stored with encrypted card data (CVV encrypted at rest)
4. Account status defaults to ACTIVE upon successful registration
5. System generates unique loyalty_number as primary identifier
6. Customer receives loyalty number via email
7. Customer can use loyalty number for future orders to accumulate points

### Spring Security Implementation (Additional Bonus)

**Authentication Framework**
Role-based authentication with JWT token management for secure session handling across all user types.

**Authorization Matrix**
- Public endpoints: Restaurant browsing, menu viewing, order placement
- Restaurant endpoints: Account management, menu editing, hours management
- Staff endpoints: Order processing, driver assignment, delivery tracking
- Administrator endpoints: Account approval tools, staff management, driver management

## Constraints and Business Rules

### Data Integrity Constraints

**Referential Integrity**
- All foreign key relationships enforced with appropriate cascade rules
- Orphaned records prevented through proper constraint definitions
- Cross-table validation rules implemented via triggers

**Business Rule Validation**
- Phone numbers: Exactly 10 digits, first digit non-zero
- Credit card numbers: Exactly 16 digits, first digit non-zero
- Email addresses: Proper format validation via CHECK constraints
- Names: Minimum 2 letters for first and last names

### Operational Constraints

**Concurrent Operations**
- Multiple customers can place orders simultaneously
- Restaurant staff can update menus while orders are being processed
- Administrative operations do not block customer or restaurant operations

**Data Consistency**
- Order totals automatically calculated and validated
- Menu item availability affects customer ordering capabilities
- Restaurant operating hours control order acceptance timing

### Performance Optimization

**Indexing Strategy**
- Primary keys automatically indexed
- Foreign keys indexed for join performance
- Composite indexes on frequently queried combinations
- Partial indexes on status fields for efficient filtering (e.g., pending approvals, active orders)

**Query Optimization**
- Materialized views for complex reporting queries
- Denormalized fields for frequently accessed calculations
- Appropriate use of JSON columns for flexible data storage

## Conclusion

This comprehensive database design supports all FrontDash requirements including core functionality, bonus features, and operational scalability. The design emphasizes data integrity, security, and performance while maintaining flexibility for future enhancements.

The unified authentication system through `account_logins` provides centralized credential management for admin, staff, and restaurant users. Status-driven workflows ensure proper progression of approvals and order fulfillment while the independent component design allows concurrent operations across all user types.

Key design features:
- Natural primary keys for orders (order_number) and loyalty members (loyalty_number)
- Unified authentication with username-based credentials
- Direct credit card storage with encryption for loyalty program
- Comprehensive foreign key relationships ensuring referential integrity
- Indexed fields for optimal query performance

The schema supports both immediate operational needs and future scalability requirements.
