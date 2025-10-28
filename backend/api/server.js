/**
 * ============================================================================
 * FrontDash API Server
 * 
 * A RESTful API for the FrontDash food delivery platform
 * This server provides endpoints for:
 *   - Restaurant management
 *   - Menu items
 *   - Orders
 *   - Loyalty members
 *   - Staff and drivers
 *   - Authentication
 * ============================================================================
 */

// ============================================================================
// 1. Import Required Modules
// ============================================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// ============================================================================
// 2. Initialize Express App
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// 3. Middleware Configuration
// ============================================================================

// Enable CORS for all routes (allows requests from any origin)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// 4. Database Configuration
// ============================================================================

// Create PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // SSL configuration for AWS RDS
    ssl: {
        rejectUnauthorized: false  // Required for AWS RDS
    },
    // Connection pool settings
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to the database:', err.stack);
    } else {
        console.log('✓ Database connected successfully');
        release();
    }
});

// ============================================================================
// 5. Helper Functions
// ============================================================================

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20251028-A1B2)
 */
function generateOrderNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${random}`;
}

/**
 * Generate a unique loyalty number
 * Format: LM-XXXXXXXX (e.g., LM-A1B2C3D4)
 */
function generateLoyaltyNumber() {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `LM-${random}`;
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Calculate service charge (8.25% of subtotal)
 */
function calculateServiceCharge(subtotal) {
    return (subtotal * 0.0825).toFixed(2);
}

/**
 * Calculate loyalty discount (10% if points >= 100)
 */
function calculateLoyaltyDiscount(subtotal, points) {
    if (points >= 100) {
        return (subtotal * 0.10).toFixed(2);
    }
    return 0;
}

// ============================================================================
// 6. Health Check Endpoint
// ============================================================================

/**
 * GET /health
 * Check if the API is running
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'FrontDash API is running'
    });
});

/**
 * GET /
 * API welcome message
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to FrontDash API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            restaurants: 'GET /api/restaurants',
            menu: 'GET /api/restaurants/:id/menu',
            orders: 'POST /api/orders',
            login: 'POST /api/auth/login'
        }
    });
});

// ============================================================================
// 7. Authentication Endpoints
// ============================================================================

/**
 * POST /api/auth/login
 * Authenticate a user (staff, admin, or restaurant)
 * 
 * Body: { username, password }
 */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Query the database for the user
        const result = await pool.query(
            'SELECT * FROM ACCOUNT_LOGINS WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is active
        if (user.account_state !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is not active' });
        }

        // Update last login time
        await pool.query(
            'UPDATE ACCOUNT_LOGINS SET last_login_at = CURRENT_TIMESTAMP WHERE username = $1',
            [username]
        );

        // Return user info (excluding password)
        res.json({
            username: user.username,
            role: user.account_role,
            state: user.account_state,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/change-password
 * Change user password
 * 
 * Body: { username, oldPassword, newPassword }
 */
app.post('/api/auth/change-password', async (req, res) => {
    try {
        const { username, oldPassword, newPassword } = req.body;

        // Validate input
        if (!username || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate new password format
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters with uppercase, lowercase, and number'
            });
        }

        // Verify old password
        const result = await pool.query(
            'SELECT password_hash FROM ACCOUNT_LOGINS WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = await verifyPassword(oldPassword, result.rows[0].password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash and update new password
        const newHash = await hashPassword(newPassword);
        await pool.query(
            'UPDATE ACCOUNT_LOGINS SET password_hash = $1 WHERE username = $2',
            [newHash, username]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 8. Restaurant Endpoints
// ============================================================================

/**
 * GET /api/restaurants
 * Get all approved restaurants
 */
app.get('/api/restaurants', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                restaurant_id,
                restaurant_name,
                restaurant_image_url,
                city,
                state,
                phone_number,
                account_status
            FROM RESTAURANTS
            WHERE account_status = 'APPROVED'
            ORDER BY restaurant_name
        `);

        res.json(result.rows);

    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/:id
 * Get a specific restaurant by ID
 */
app.get('/api/restaurants/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM RESTAURANTS WHERE restaurant_id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/restaurants/register
 * Register a new restaurant (creates pending request)
 * 
 * Body: {
 *   restaurant_name, owner_name, email_address,
 *   street_address, city, state, zip_code, phone_number,
 *   restaurant_image_url (optional)
 * }
 */
app.post('/api/restaurants/register', async (req, res) => {
    try {
        const {
            restaurant_name,
            owner_name,
            email_address,
            street_address,
            city,
            state,
            zip_code,
            phone_number,
            restaurant_image_url
        } = req.body;

        // Validate required fields
        if (!restaurant_name || !owner_name || !email_address || 
            !street_address || !city || !state || !zip_code || !phone_number) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate phone number (10 digits, first digit not 0)
        if (!/^[1-9]\d{9}$/.test(phone_number)) {
            return res.status(400).json({ error: 'Phone number must be 10 digits, first digit cannot be 0' });
        }

        // Generate username (first 2 letters of restaurant name + 2 digits)
        const baseUsername = restaurant_name.substring(0, 2).toLowerCase();
        const randomDigits = Math.floor(Math.random() * 90 + 10); // 10-99
        const username = `${baseUsername}${randomDigits}`;

        // Generate initial password
        const initialPassword = 'TempPass' + Math.floor(Math.random() * 900 + 100); // TempPass100-999
        const hashedPassword = await hashPassword(initialPassword);

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create account login
            await client.query(
                `INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
                 VALUES ($1, $2, 'RESTAURANT', 'ACTIVE')`,
                [username, hashedPassword]
            );

            // Create restaurant
            const restaurantResult = await client.query(
                `INSERT INTO RESTAURANTS (
                    restaurant_name, owner_name, restaurant_image_url,
                    email_address, street_address, city, state, zip_code,
                    phone_number, account_status, username
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10)
                RETURNING restaurant_id`,
                [restaurant_name, owner_name, restaurant_image_url || null,
                 email_address, street_address, city, state, zip_code,
                 phone_number, username]
            );

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Restaurant registration submitted. Awaiting approval.',
                restaurant_id: restaurantResult.rows[0].restaurant_id,
                username: username,
                temporary_password: initialPassword,
                note: 'Please save these credentials. The password will be sent to your email.'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Restaurant registration error:', error);
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Restaurant name or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * PUT /api/restaurants/:id/approve
 * Approve a restaurant registration (admin only)
 */
app.put('/api/restaurants/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE RESTAURANTS 
             SET account_status = 'APPROVED', approved_at = CURRENT_TIMESTAMP
             WHERE restaurant_id = $1 AND account_status = 'PENDING'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found or already processed' });
        }

        res.json({
            message: 'Restaurant approved successfully',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Approve restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant (also deletes menu items, operating hours, and account via CASCADE)
 */
app.delete('/api/restaurants/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // First check if restaurant exists
        const checkResult = await pool.query(
            'SELECT restaurant_id, username FROM RESTAURANTS WHERE restaurant_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        const username = checkResult.rows[0].username;

        // Delete the restaurant (CASCADE will delete menu items, hours, and account login)
        await pool.query(
            'DELETE FROM RESTAURANTS WHERE restaurant_id = $1',
            [id]
        );

        res.json({
            message: 'Restaurant deleted successfully',
            restaurant_id: parseInt(id)
        });

    } catch (error) {
        console.error('Delete restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 9. Menu Item Endpoints
// ============================================================================

/**
 * GET /api/restaurants/:id/menu
 * Get all menu items for a restaurant
 */
app.get('/api/restaurants/:id/menu', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM MENU_ITEMS 
             WHERE restaurant_id = $1 
             ORDER BY item_name`,
            [id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get menu error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/restaurants/:id/menu
 * Add a new menu item
 * 
 * Body: { item_name, item_description, item_price, item_image_url, availability_status }
 */
app.post('/api/restaurants/:id/menu', async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, item_description, item_price, item_image_url, availability_status } = req.body;

        // Validate required fields
        if (!item_name || !item_price) {
            return res.status(400).json({ error: 'Item name and price are required' });
        }

        const result = await pool.query(
            `INSERT INTO MENU_ITEMS (
                restaurant_id, item_name, item_description, 
                item_image_url, item_price, availability_status
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [id, item_name, item_description || null, 
             item_image_url || null, item_price, availability_status || 'AVAILABLE']
        );

        res.status(201).json({
            message: 'Menu item added successfully',
            item: result.rows[0]
        });

    } catch (error) {
        console.error('Add menu item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/menu-items/:id
 * Update a menu item
 */
app.put('/api/menu-items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, item_description, item_price, item_image_url, availability_status } = req.body;

        const result = await pool.query(
            `UPDATE MENU_ITEMS 
             SET item_name = COALESCE($1, item_name),
                 item_description = COALESCE($2, item_description),
                 item_price = COALESCE($3, item_price),
                 item_image_url = COALESCE($4, item_image_url),
                 availability_status = COALESCE($5, availability_status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE menu_item_id = $6
             RETURNING *`,
            [item_name, item_description, item_price, item_image_url, availability_status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        res.json({
            message: 'Menu item updated successfully',
            item: result.rows[0]
        });

    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/menu-items/:id
 * Delete a menu item
 */
app.delete('/api/menu-items/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM MENU_ITEMS WHERE menu_item_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        res.json({ message: 'Menu item deleted successfully' });

    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 10. Order Endpoints
// ============================================================================

/**
 * POST /api/orders
 * Create a new order
 * 
 * Body: {
 *   restaurant_id,
 *   loyalty_number (optional),
 *   guest_phone (required if no loyalty_number),
 *   delivery_address: { building_number, street_name, apartment, city, state, zip_code },
 *   delivery_contact_name,
 *   delivery_contact_phone,
 *   items: [{ menu_item_id, quantity }],
 *   tip_amount
 * }
 */
app.post('/api/orders', async (req, res) => {
    try {
        const {
            restaurant_id,
            loyalty_number,
            guest_phone,
            delivery_address,
            delivery_contact_name,
            delivery_contact_phone,
            items,
            tip_amount
        } = req.body;

        // Validate required fields
        if (!restaurant_id || !delivery_address || !delivery_contact_name || 
            !delivery_contact_phone || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // For non-loyalty orders, guest_phone is required
        if (!loyalty_number && !guest_phone) {
            return res.status(400).json({ error: 'Guest phone is required for non-loyalty orders' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Calculate subtotal by fetching prices from database
            let subtotal = 0;
            const orderItems = [];

            for (const item of items) {
                const menuResult = await client.query(
                    'SELECT item_name, item_price FROM MENU_ITEMS WHERE menu_item_id = $1',
                    [item.menu_item_id]
                );

                if (menuResult.rows.length === 0) {
                    throw new Error(`Menu item ${item.menu_item_id} not found`);
                }

                const menuItem = menuResult.rows[0];
                const itemSubtotal = parseFloat(menuItem.item_price) * item.quantity;
                subtotal += itemSubtotal;

                orderItems.push({
                    menu_item_id: item.menu_item_id,
                    item_name: menuItem.item_name,
                    item_price: menuItem.item_price,
                    quantity: item.quantity
                });
            }

            // Calculate charges
            const serviceCharge = calculateServiceCharge(subtotal);
            let loyaltyDiscount = 0;

            // Check loyalty points if loyalty_number provided
            if (loyalty_number) {
                const loyaltyResult = await client.query(
                    'SELECT loyalty_points FROM LOYALTY_MEMBERS WHERE loyalty_number = $1',
                    [loyalty_number]
                );

                if (loyaltyResult.rows.length > 0) {
                    const points = loyaltyResult.rows[0].loyalty_points;
                    loyaltyDiscount = calculateLoyaltyDiscount(subtotal, points);
                }
            }

            const grandTotal = (
                parseFloat(subtotal) + 
                parseFloat(serviceCharge) + 
                parseFloat(tip_amount || 0) - 
                parseFloat(loyaltyDiscount)
            ).toFixed(2);

            // Generate order number
            const orderNumber = generateOrderNumber();

            // Insert order
            await client.query(
                `INSERT INTO ORDERS (
                    order_number, restaurant_id, loyalty_number, guest_phone,
                    delivery_building_number, delivery_street_name, delivery_apartment,
                    delivery_city, delivery_state, delivery_zip_code,
                    delivery_contact_name, delivery_contact_phone,
                    subtotal_amount, service_charge, tip_amount, loyalty_discount, grand_total,
                    order_status, estimated_delivery_time
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'PENDING', CURRENT_TIMESTAMP + INTERVAL '45 minutes')`,
                [
                    orderNumber, restaurant_id, loyalty_number || null, guest_phone || null,
                    delivery_address.building_number, delivery_address.street_name, 
                    delivery_address.apartment || null, delivery_address.city, 
                    delivery_address.state, delivery_address.zip_code,
                    delivery_contact_name, delivery_contact_phone,
                    subtotal, serviceCharge, tip_amount || 0, loyaltyDiscount, grandTotal
                ]
            );

            // Insert order items
            for (const orderItem of orderItems) {
                await client.query(
                    `INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orderNumber, orderItem.menu_item_id, orderItem.item_name, 
                     orderItem.item_price, orderItem.quantity]
                );
            }

            // Update loyalty points if applicable
            if (loyalty_number) {
                const pointsEarned = Math.floor(subtotal); // 1 point per dollar
                await client.query(
                    `UPDATE LOYALTY_MEMBERS 
                     SET loyalty_points = loyalty_points + $1 - $2
                     WHERE loyalty_number = $3`,
                    [pointsEarned, loyaltyDiscount > 0 ? 100 : 0, loyalty_number]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Order created successfully',
                order_number: orderNumber,
                subtotal: subtotal,
                service_charge: serviceCharge,
                tip_amount: tip_amount || 0,
                loyalty_discount: loyaltyDiscount,
                grand_total: grandTotal,
                estimated_delivery_time: '45 minutes'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

/**
 * GET /api/orders/:orderNumber
 * Get order details
 */
app.get('/api/orders/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;

        // Get order
        const orderResult = await pool.query(
            'SELECT * FROM ORDERS WHERE order_number = $1',
            [orderNumber]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order items
        const itemsResult = await pool.query(
            'SELECT * FROM ORDER_ITEMS WHERE order_number = $1',
            [orderNumber]
        );

        res.json({
            order: orderResult.rows[0],
            items: itemsResult.rows
        });

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/orders
 * Get all orders (with optional filters)
 * Query params: status, restaurant_id
 */
app.get('/api/orders', async (req, res) => {
    try {
        const { status, restaurant_id } = req.query;

        let query = 'SELECT * FROM ORDERS WHERE 1=1';
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND order_status = $${params.length}`;
        }

        if (restaurant_id) {
            params.push(restaurant_id);
            query += ` AND restaurant_id = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/orders/:orderNumber/status
 * Update order status
 * 
 * Body: { status }
 */
app.put('/api/orders/:orderNumber/status', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const { status } = req.body;

        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE ORDERS SET order_status = $1 WHERE order_number = $2 RETURNING *',
            [status, orderNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            message: 'Order status updated successfully',
            order: result.rows[0]
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 11. Loyalty Member Endpoints
// ============================================================================

/**
 * POST /api/loyalty-members/register
 * Register a new loyalty member
 * 
 * Body: {
 *   first_name, last_name, email_address, phone_number,
 *   card_number, card_holder_name, card_expiry, card_cvv
 * }
 */
app.post('/api/loyalty-members/register', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email_address,
            phone_number,
            card_number,
            card_holder_name,
            card_expiry,
            card_cvv
        } = req.body;

        // Validate required fields
        if (!first_name || !last_name || !email_address || !phone_number ||
            !card_number || !card_holder_name || !card_expiry || !card_cvv) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate phone number
        if (!/^[1-9]\d{9}$/.test(phone_number)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Generate loyalty number
        const loyaltyNumber = generateLoyaltyNumber();

        const result = await pool.query(
            `INSERT INTO LOYALTY_MEMBERS (
                loyalty_number, first_name, last_name, email_address, phone_number,
                card_number, card_holder_name, card_expiry, card_cvv,
                account_status, loyalty_points
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', 0)
            RETURNING loyalty_number, first_name, last_name, email_address, loyalty_points`,
            [loyaltyNumber, first_name, last_name, email_address, phone_number,
             card_number, card_holder_name, card_expiry, card_cvv]
        );

        res.status(201).json({
            message: 'Loyalty member registered successfully',
            member: result.rows[0]
        });

    } catch (error) {
        console.error('Loyalty member registration error:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Email address already registered' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * GET /api/loyalty-members/:loyaltyNumber
 * Get loyalty member details
 */
app.get('/api/loyalty-members/:loyaltyNumber', async (req, res) => {
    try {
        const { loyaltyNumber } = req.params;

        const result = await pool.query(
            `SELECT loyalty_number, first_name, last_name, email_address, 
                    phone_number, account_status, loyalty_points, created_at
             FROM LOYALTY_MEMBERS 
             WHERE loyalty_number = $1`,
            [loyaltyNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Loyalty member not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Get loyalty member error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 12. Staff Management Endpoints
// ============================================================================

/**
 * POST /api/staff
 * Add a new staff member (admin only)
 * 
 * Body: { first_name, last_name }
 */
app.post('/api/staff', async (req, res) => {
    try {
        const { first_name, last_name } = req.body;

        // Validate input
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        // Generate username (lastname + 2 digits)
        const baseUsername = last_name.toLowerCase().substring(0, 8);
        const randomDigits = Math.floor(Math.random() * 90 + 10);
        const username = `${baseUsername}${randomDigits}`;

        // Generate initial password
        const initialPassword = 'Staff' + Math.floor(Math.random() * 900 + 100);
        const hashedPassword = await hashPassword(initialPassword);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create account login
            await client.query(
                `INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
                 VALUES ($1, $2, 'STAFF', 'ACTIVE')`,
                [username, hashedPassword]
            );

            // Create staff member
            const staffResult = await client.query(
                `INSERT INTO STAFF_MEMBERS (first_name, last_name, username, account_status, is_first_login)
                 VALUES ($1, $2, $3, 'ACTIVE', TRUE)
                 RETURNING *`,
                [first_name, last_name, username]
            );

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Staff member added successfully',
                staff: staffResult.rows[0],
                credentials: {
                    username: username,
                    temporary_password: initialPassword
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Add staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/staff
 * Get all staff members
 */
app.get('/api/staff', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM STAFF_MEMBERS ORDER BY last_name, first_name'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/staff/:id
 * Delete a staff member
 */
app.delete('/api/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get username first
            const staffResult = await client.query(
                'SELECT username FROM STAFF_MEMBERS WHERE staff_id = $1',
                [id]
            );

            if (staffResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Staff member not found' });
            }

            const username = staffResult.rows[0].username;

            // Delete staff member (will cascade delete account via FK)
            await client.query('DELETE FROM STAFF_MEMBERS WHERE staff_id = $1', [id]);
            await client.query('DELETE FROM ACCOUNT_LOGINS WHERE username = $1', [username]);

            await client.query('COMMIT');

            res.json({ message: 'Staff member deleted successfully' });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Delete staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 13. Driver Management Endpoints
// ============================================================================

/**
 * POST /api/drivers
 * Hire a new driver
 * 
 * Body: { driver_name }
 */
app.post('/api/drivers', async (req, res) => {
    try {
        const { driver_name } = req.body;

        if (!driver_name) {
            return res.status(400).json({ error: 'Driver name is required' });
        }

        const result = await pool.query(
            `INSERT INTO DRIVERS (driver_name, driver_status)
             VALUES ($1, 'AVAILABLE')
             RETURNING *`,
            [driver_name]
        );

        res.status(201).json({
            message: 'Driver hired successfully',
            driver: result.rows[0]
        });

    } catch (error) {
        console.error('Hire driver error:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Driver name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * GET /api/drivers
 * Get all drivers
 */
app.get('/api/drivers', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM DRIVERS ORDER BY driver_name'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/drivers/:id/status
 * Update driver status
 * 
 * Body: { status }
 */
app.put('/api/drivers/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            'UPDATE DRIVERS SET driver_status = $1 WHERE driver_id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.json({
            message: 'Driver status updated successfully',
            driver: result.rows[0]
        });

    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/drivers/:id
 * Fire a driver
 */
app.delete('/api/drivers/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM DRIVERS WHERE driver_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.json({ message: 'Driver removed successfully' });

    } catch (error) {
        console.error('Delete driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 14. Operating Hours Endpoints
// ============================================================================

/**
 * POST /api/restaurants/:id/hours
 * Set operating hours for a restaurant
 * 
 * Body: { day_of_week, opening_time, closing_time, is_closed }
 */
app.post('/api/restaurants/:id/hours', async (req, res) => {
    try {
        const { id } = req.params;
        const { day_of_week, opening_time, closing_time, is_closed } = req.body;

        const result = await pool.query(
            `INSERT INTO RESTAURANT_OPERATING_HOURS 
             (restaurant_id, day_of_week, opening_time, closing_time, is_closed)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (restaurant_id, day_of_week) 
             DO UPDATE SET opening_time = $3, closing_time = $4, is_closed = $5
             RETURNING *`,
            [id, day_of_week, opening_time || null, closing_time || null, is_closed || false]
        );

        res.status(201).json({
            message: 'Operating hours set successfully',
            hours: result.rows[0]
        });

    } catch (error) {
        console.error('Set operating hours error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/:id/hours
 * Get operating hours for a restaurant
 */
app.get('/api/restaurants/:id/hours', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM RESTAURANT_OPERATING_HOURS 
             WHERE restaurant_id = $1 
             ORDER BY 
                CASE day_of_week
                    WHEN 'MONDAY' THEN 1
                    WHEN 'TUESDAY' THEN 2
                    WHEN 'WEDNESDAY' THEN 3
                    WHEN 'THURSDAY' THEN 4
                    WHEN 'FRIDAY' THEN 5
                    WHEN 'SATURDAY' THEN 6
                    WHEN 'SUNDAY' THEN 7
                END`,
            [id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get operating hours error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 15. Error Handling Middleware
// ============================================================================

// 404 handler - must be after all routes
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// General error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// 16. Start Server
// ============================================================================

app.listen(PORT, () => {
    console.log('================================================');
    console.log('   FrontDash API Server');
    console.log('================================================');
    console.log(`✓ Server is running on port ${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log('================================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});