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
// 1. Import Required Modules (ES Modules)
// ============================================================================

import express, { Request, Response, NextFunction, Application } from 'express';
import pg from 'pg';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const { Pool } = pg;

// ============================================================================
// 2. Type Definitions
// ============================================================================

interface AccountLogin {
  username: string;
  password_hash: string;
  account_role: 'ADMIN' | 'STAFF' | 'RESTAURANT';
  account_state: 'ACTIVE' | 'INACTIVE';
  last_login_at?: Date;
}

interface Restaurant {
  restaurant_id: number;
  restaurant_name: string;
  owner_name: string;
  restaurant_image_url?: string;
  email_address: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  account_status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'WITHDRAWAL_PENDING' | 'WITHDRAWN';
  username: string;
  approved_at?: Date;
}

interface MenuItem {
  menu_item_id: number;
  restaurant_id: number;
  item_name: string;
  item_description?: string;
  item_image_url?: string;
  item_price: number;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE';
  updated_at?: Date;
}

interface Order {
  order_number: string;
  restaurant_id: number;
  loyalty_number?: string;
  guest_phone?: string;
  delivery_building_number: string;
  delivery_street_name: string;
  delivery_apartment?: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  subtotal_amount: number;
  service_charge: number;
  tip_amount: number;
  loyalty_discount: number;
  grand_total: number;
  order_status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  estimated_delivery_time: Date;
  actual_delivery_time?: Date;
  delivery_duration_minutes?: number;
  assigned_driver_id?: number;
  created_at: Date;
}

interface OrderItem {
  order_item_id: number;
  order_number: string;
  menu_item_id: number;
  item_name: string;
  item_price: number;
  quantity: number;
}

interface LoyaltyMember {
  loyalty_number: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  card_number: string;
  card_holder_name: string;
  card_expiry: string;
  card_cvv: string;
  account_status: 'ACTIVE' | 'INACTIVE';
  loyalty_points: number;
  created_at: Date;
}

interface StaffMember {
  staff_id: number;
  first_name: string;
  last_name: string;
  username: string;
  account_status: 'ACTIVE' | 'INACTIVE';
  is_first_login: boolean;
}

interface Driver {
  driver_id: number;
  driver_name: string;
  driver_status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

interface OperatingHours {
  hours_id: number;
  restaurant_id: number;
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  opening_time?: string;
  closing_time?: string;
  is_closed: boolean;
}

interface DeliveryAddress {
  building_number: string;
  street_name: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
}

interface OrderItemInput {
  menu_item_id: number;
  quantity: number;
}

// ============================================================================
// 3. Initialize Express App
// ============================================================================

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// 4. Middleware Configuration
// ============================================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// 5. Database Configuration
// ============================================================================

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, _client, release) => {
    if (err) {
        console.error('❌ Error connecting to the database:', err.stack);
    } else {
        console.log('✓ Database connected successfully');
        release();
    }
});

// ============================================================================
// 5b. S3 Configuration (for image uploads)
// ============================================================================

const S3_BUCKET = process.env.S3_BUCKET || 'frontdash-images';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

// S3 client uses IAM role credentials when running on EC2
// For local development, uses ~/.aws/credentials or environment variables
const s3Client = new S3Client({ region: S3_REGION });

// ============================================================================
// 6. Helper Functions
// ============================================================================

function generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${random}`;
}

function generateLoyaltyNumber(): string {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `LM-${random}`;
}

async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/** Service charge rate (8.25%) */
const SERVICE_CHARGE_RATE = 0.0825;

/** Loyalty discount rate (10%) */
const LOYALTY_DISCOUNT_RATE = 0.10;

/** Minimum points required for loyalty discount */
const LOYALTY_DISCOUNT_THRESHOLD = 100;

/** PostgreSQL unique constraint violation error code */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Type guard for PostgreSQL errors
 * Checks if an error has the PostgreSQL error code property
 */
function isPgError(error: unknown): error is { code: string; message?: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
    );
}

function calculateServiceCharge(subtotal: number): string {
    return (subtotal * SERVICE_CHARGE_RATE).toFixed(2);
}

function calculateLoyaltyDiscount(subtotal: number, points: number): number {
    if (points >= LOYALTY_DISCOUNT_THRESHOLD) {
        return parseFloat((subtotal * LOYALTY_DISCOUNT_RATE).toFixed(2));
    }
    return 0;
}

// ============================================================================
// 7. Health Check Endpoint
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'FrontDash API is running'
    });
});

app.get('/', (_req: Request, res: Response) => {
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
// 8. Authentication Endpoints
// ============================================================================

app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body as { username?: string; password?: string };

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const result = await pool.query<AccountLogin>(
            'SELECT * FROM ACCOUNT_LOGINS WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.account_state !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is not active' });
        }

        await pool.query(
            'UPDATE ACCOUNT_LOGINS SET last_login_at = CURRENT_TIMESTAMP WHERE username = $1',
            [username]
        );

        // Build response with role-specific data
        const response: {
            username: string;
            role: string;
            state: string;
            message: string;
            restaurant_id?: number;
            restaurant_name?: string;
            staff_id?: number;
            must_change_password?: boolean;
        } = {
            username: user.username,
            role: user.account_role,
            state: user.account_state,
            message: 'Login successful'
        };

        // Add restaurant_id and restaurant_name for restaurant users
        if (user.account_role === 'RESTAURANT') {
            const restaurantResult = await pool.query<{ restaurant_id: number; restaurant_name: string }>(
                'SELECT restaurant_id, restaurant_name FROM RESTAURANTS WHERE username = $1',
                [username]
            );
            if (restaurantResult.rows.length > 0) {
                response.restaurant_id = restaurantResult.rows[0].restaurant_id;
                response.restaurant_name = restaurantResult.rows[0].restaurant_name;
            }
        }

        // Add staff_id and must_change_password for staff users
        if (user.account_role === 'STAFF') {
            const staffResult = await pool.query<{ staff_id: number; is_first_login: boolean }>(
                'SELECT staff_id, is_first_login FROM STAFF_MEMBERS WHERE username = $1',
                [username]
            );
            if (staffResult.rows.length > 0) {
                response.staff_id = staffResult.rows[0].staff_id;
                response.must_change_password = staffResult.rows[0].is_first_login;
            }
        }

        res.json(response);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/change-password', async (req: Request, res: Response) => {
    try {
        const { username, oldPassword, newPassword } = req.body as {
            username?: string;
            oldPassword?: string;
            newPassword?: string;
        };

        if (!username || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters with uppercase, lowercase, and number'
            });
        }

        const result = await pool.query<{ password_hash: string }>(
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

// Logout endpoint - clears session (stateless API, client clears tokens)
app.post('/api/auth/logout', async (_req: Request, res: Response) => {
    // Since this is a stateless API (no server-side sessions),
    // logout is handled client-side by clearing tokens/cookies.
    // This endpoint exists for consistency and future session support.
    res.json({
        success: true,
        message: 'Logged out successfully. Please clear local tokens.'
    });
});

// ============================================================================
// 9. Restaurant Endpoints
// ============================================================================

app.get('/api/restaurants', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query<Restaurant>(`
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

app.get('/api/restaurants/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Restaurant>(
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
 * Get restaurant by URL slug
 *
 * Finds a restaurant by matching its name-derived slug.
 * Used by the customer-facing detail page: /restaurant/[slug]
 *
 * Slug generation logic (MUST match frontend lib/transforms/restaurant.ts):
 * 1. Lowercase the name
 * 2. Replace '&' with 'and'
 * 3. Remove apostrophes
 * 4. Replace non-alphanumeric chars with hyphens
 * 5. Trim leading/trailing hyphens
 *
 * @example GET /api/restaurants/by-slug/joes-pizza
 */
app.get('/api/restaurants/by-slug/:slug', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        // Match slug using PostgreSQL string functions
        // This replicates the frontend toSlug() logic in SQL for efficient single-row lookup
        const result = await pool.query<Restaurant>(`
            SELECT *
            FROM RESTAURANTS
            WHERE account_status = 'APPROVED'
            AND TRIM(BOTH '-' FROM
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            LOWER(restaurant_name),
                            '&', 'and', 'g'
                        ),
                        '''', '', 'g'
                    ),
                    '[^a-z0-9]+', '-', 'g'
                )
            ) = $1
            LIMIT 1
        `, [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Get restaurant by slug error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update restaurant contact information
interface RestaurantUpdateBody {
    owner_name?: string;
    email_address?: string;
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone_number?: string;
    restaurant_image_url?: string;
}

app.put('/api/restaurants/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates: RestaurantUpdateBody = req.body;

        // Check restaurant exists
        const checkResult = await pool.query<Restaurant>(
            'SELECT * FROM RESTAURANTS WHERE restaurant_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Validate phone number if provided
        if (updates.phone_number && !/^[1-9]\d{9}$/.test(updates.phone_number)) {
            return res.status(400).json({ error: 'Phone number must be 10 digits and cannot start with 0' });
        }

        // Build dynamic update query
        const fields: string[] = [];
        const values: (string | undefined)[] = [];
        let paramIndex = 1;

        if (updates.owner_name) {
            fields.push(`owner_name = $${paramIndex++}`);
            values.push(updates.owner_name);
        }
        if (updates.email_address) {
            fields.push(`email_address = $${paramIndex++}`);
            values.push(updates.email_address);
        }
        if (updates.street_address) {
            fields.push(`street_address = $${paramIndex++}`);
            values.push(updates.street_address);
        }
        if (updates.city) {
            fields.push(`city = $${paramIndex++}`);
            values.push(updates.city);
        }
        if (updates.state) {
            fields.push(`state = $${paramIndex++}`);
            values.push(updates.state);
        }
        if (updates.zip_code) {
            fields.push(`zip_code = $${paramIndex++}`);
            values.push(updates.zip_code);
        }
        if (updates.phone_number) {
            fields.push(`phone_number = $${paramIndex++}`);
            values.push(updates.phone_number);
        }
        if (updates.restaurant_image_url !== undefined) {
            fields.push(`restaurant_image_url = $${paramIndex++}`);
            values.push(updates.restaurant_image_url);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `
            UPDATE RESTAURANTS
            SET ${fields.join(', ')}
            WHERE restaurant_id = $${paramIndex}
            RETURNING *
        `;

        const result = await pool.query<Restaurant>(query, values);

        res.json({
            message: 'Restaurant updated successfully',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

interface RestaurantRegistrationBody {
    restaurant_name: string;
    owner_name: string;
    email_address: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    phone_number: string;
    restaurant_image_url?: string;
}

app.post('/api/restaurants/register', async (req: Request, res: Response) => {
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
        } = req.body as RestaurantRegistrationBody;

        if (!restaurant_name || !owner_name || !email_address ||
            !street_address || !city || !state || !zip_code || !phone_number) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        if (!/^[1-9]\d{9}$/.test(phone_number)) {
            return res.status(400).json({ error: 'Phone number must be 10 digits, first digit cannot be 0' });
        }

        const baseUsername = restaurant_name.substring(0, 2).toLowerCase();
        const randomDigits = Math.floor(Math.random() * 90 + 10);
        const username = `${baseUsername}${randomDigits}`;

        const initialPassword = 'TempPass' + Math.floor(Math.random() * 900 + 100);
        const hashedPassword = await hashPassword(initialPassword);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
                 VALUES ($1, $2, 'RESTAURANT', 'ACTIVE')`,
                [username, hashedPassword]
            );

            const restaurantResult = await client.query<{ restaurant_id: number }>(
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
        if (isPgError(error) && error.code === PG_UNIQUE_VIOLATION) {
            res.status(409).json({ error: 'Restaurant name or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.put('/api/restaurants/:id/approve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Restaurant>(
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

app.put('/api/restaurants/:id/reject', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Restaurant>(
            'DELETE FROM RESTAURANTS WHERE restaurant_id = $1 AND account_status = \'PENDING\' RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found or already processed' });
        }

        res.json({
            message: 'Restaurant registration rejected and deleted',
            restaurant_id: parseInt(id)
        });

    } catch (error) {
        console.error('Reject restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/restaurants/:id/suspend', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Restaurant>(
            `UPDATE RESTAURANTS
             SET account_status = 'SUSPENDED'
             WHERE restaurant_id = $1 AND account_status = 'APPROVED'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found or not approved' });
        }

        res.json({
            message: 'Restaurant suspended successfully',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Suspend restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// Restaurant Withdrawal Endpoints
// ============================================================================

// Request withdrawal from FrontDash (by restaurant)
app.post('/api/restaurants/:id/withdraw', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Restaurant>(
            `UPDATE RESTAURANTS
             SET account_status = 'WITHDRAWAL_PENDING'
             WHERE restaurant_id = $1 AND account_status = 'APPROVED'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found or not in approved status' });
        }

        res.json({
            message: 'Withdrawal request submitted successfully. Awaiting admin approval.',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Withdraw restaurant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all withdrawal requests (admin)
app.get('/api/restaurants/withdrawals', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query<Restaurant>(
            `SELECT * FROM RESTAURANTS
             WHERE account_status = 'WITHDRAWAL_PENDING'
             ORDER BY restaurant_name`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get withdrawal requests error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve withdrawal request (admin)
app.put('/api/restaurants/:id/withdraw/approve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Get restaurant to find associated username
        const restaurantResult = await pool.query<Restaurant>(
            'SELECT username FROM RESTAURANTS WHERE restaurant_id = $1 AND account_status = \'WITHDRAWAL_PENDING\'',
            [id]
        );

        if (restaurantResult.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found or no pending withdrawal' });
        }

        const username = restaurantResult.rows[0].username;

        // Update restaurant status to WITHDRAWN
        const result = await pool.query<Restaurant>(
            `UPDATE RESTAURANTS
             SET account_status = 'WITHDRAWN'
             WHERE restaurant_id = $1
             RETURNING *`,
            [id]
        );

        // Deactivate the associated login account
        await pool.query(
            `UPDATE ACCOUNT_LOGINS
             SET account_state = 'INACTIVE'
             WHERE username = $1`,
            [username]
        );

        res.json({
            message: 'Withdrawal approved. Restaurant has been removed from FrontDash.',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject withdrawal request (admin)
app.put('/api/restaurants/:id/withdraw/reject', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Restaurant>(
            `UPDATE RESTAURANTS
             SET account_status = 'APPROVED'
             WHERE restaurant_id = $1 AND account_status = 'WITHDRAWAL_PENDING'
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found or no pending withdrawal' });
        }

        res.json({
            message: 'Withdrawal request rejected. Restaurant remains active.',
            restaurant: result.rows[0]
        });

    } catch (error) {
        console.error('Reject withdrawal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/restaurants/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const checkResult = await pool.query<{ restaurant_id: number; username: string }>(
            'SELECT restaurant_id, username FROM RESTAURANTS WHERE restaurant_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

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
// 10. Menu Item Endpoints
// ============================================================================

app.get('/api/restaurants/:id/menu', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<MenuItem>(
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

interface MenuItemBody {
    item_name: string;
    item_description?: string;
    item_price: number;
    item_image_url?: string;
    availability_status?: 'AVAILABLE' | 'UNAVAILABLE';
}

app.post('/api/restaurants/:id/menu', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { item_name, item_description, item_price, item_image_url, availability_status } = req.body as MenuItemBody;

        if (!item_name || !item_price) {
            return res.status(400).json({ error: 'Item name and price are required' });
        }

        const result = await pool.query<MenuItem>(
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
            menu_item: result.rows[0]
        });

    } catch (error) {
        console.error('Add menu item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/menu-items/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { item_name, item_description, item_price, item_image_url, availability_status } = req.body as Partial<MenuItemBody>;

        const result = await pool.query<MenuItem>(
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
            menu_item: result.rows[0]
        });

    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/menu-items/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<MenuItem>(
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
// 10b. Image Upload Endpoints (Presigned URLs)
// ============================================================================

/**
 * Request body for generating a presigned upload URL
 */
interface UploadUrlRequest {
    /** Type of image: 'restaurant' or 'menu-item' */
    type: 'restaurant' | 'menu-item';
    /** ID of the restaurant or menu item */
    id: number;
    /** File extension (e.g., 'jpg', 'png', 'webp') */
    fileExtension: string;
}

/**
 * Generate a presigned URL for uploading an image to S3.
 *
 * The frontend uses this URL to upload directly to S3, bypassing the server.
 * This reduces server load and allows larger file uploads.
 *
 * Flow:
 * 1. Frontend requests presigned URL with type, id, and fileExtension
 * 2. Server generates URL valid for 5 minutes
 * 3. Frontend PUTs the image directly to S3 using the URL
 * 4. Frontend updates the restaurant/menu-item with the final image URL
 */
app.post('/api/uploads/presigned-url', async (req: Request, res: Response) => {
    try {
        const { type, id, fileExtension }: UploadUrlRequest = req.body;

        // Validate required fields
        if (!type || !id || !fileExtension) {
            return res.status(400).json({
                error: 'Missing required fields: type, id, fileExtension'
            });
        }

        // Validate type
        if (type !== 'restaurant' && type !== 'menu-item') {
            return res.status(400).json({
                error: 'Invalid type. Must be "restaurant" or "menu-item"'
            });
        }

        // Validate file extension
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const ext = fileExtension.toLowerCase().replace('.', '');
        if (!allowedExtensions.includes(ext)) {
            return res.status(400).json({
                error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
            });
        }

        // Generate unique key: type/id/timestamp.extension
        const timestamp = Date.now();
        const key = `${type}s/${id}/${timestamp}.${ext}`;

        // Create presigned URL for PUT operation
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 300, // 5 minutes
        });

        // The public URL where the image will be accessible after upload
        const imageUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;

        res.json({
            uploadUrl: presignedUrl,
            imageUrl,
            expiresIn: 300,
        });

    } catch (error) {
        console.error('Generate presigned URL error:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// ============================================================================
// 11. Order Endpoints
// ============================================================================

interface CreateOrderBody {
    restaurant_id: number;
    loyalty_number?: string;
    guest_phone?: string;
    delivery_address: DeliveryAddress;
    delivery_contact_name: string;
    delivery_contact_phone: string;
    items: OrderItemInput[];
    tip_amount?: number;
}

app.post('/api/orders', async (req: Request, res: Response) => {
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
        } = req.body as CreateOrderBody;

        if (!restaurant_id || !delivery_address || !delivery_contact_name ||
            !delivery_contact_phone || !items || items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!loyalty_number && !guest_phone) {
            return res.status(400).json({ error: 'Guest phone is required for non-loyalty orders' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            let subtotal = 0;
            const orderItems: Array<{
                menu_item_id: number;
                item_name: string;
                item_price: number;
                quantity: number;
            }> = [];

            for (const item of items) {
                const menuResult = await client.query<{ item_name: string; item_price: string }>(
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
                    item_price: parseFloat(menuItem.item_price),
                    quantity: item.quantity
                });
            }

            const serviceCharge = calculateServiceCharge(subtotal);
            let loyaltyDiscount = 0;

            if (loyalty_number) {
                const loyaltyResult = await client.query<{ loyalty_points: number }>(
                    'SELECT loyalty_points FROM LOYALTY_MEMBERS WHERE loyalty_number = $1',
                    [loyalty_number]
                );

                if (loyaltyResult.rows.length > 0) {
                    const points = loyaltyResult.rows[0].loyalty_points;
                    loyaltyDiscount = calculateLoyaltyDiscount(subtotal, points);
                }
            }

            const grandTotal = (
                subtotal +
                parseFloat(serviceCharge) +
                (tip_amount || 0) -
                loyaltyDiscount
            ).toFixed(2);

            const orderNumber = generateOrderNumber();

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

            for (const orderItem of orderItems) {
                await client.query(
                    `INSERT INTO ORDER_ITEMS (order_number, menu_item_id, item_name, item_price, quantity)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orderNumber, orderItem.menu_item_id, orderItem.item_name,
                     orderItem.item_price, orderItem.quantity]
                );
            }

            if (loyalty_number) {
                const pointsEarned = Math.floor(subtotal);
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
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ error: errorMessage });
    }
});

app.get('/api/orders/:orderNumber', async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;

        const orderResult = await pool.query<Order>(
            'SELECT * FROM ORDERS WHERE order_number = $1',
            [orderNumber]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const itemsResult = await pool.query<OrderItem>(
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

app.get('/api/orders', async (req: Request, res: Response) => {
    try {
        const { status, restaurant_id } = req.query as { status?: string; restaurant_id?: string };

        let query = 'SELECT * FROM ORDERS WHERE 1=1';
        const params: (string | number)[] = [];

        if (status) {
            params.push(status);
            query += ` AND order_status = $${params.length}`;
        }

        if (restaurant_id) {
            params.push(restaurant_id);
            query += ` AND restaurant_id = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query<Order>(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/orders/:orderNumber/status', async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;
        const { status } = req.body as { status: string };

        const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query<Order>(
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

app.put('/api/orders/:orderNumber/assign-driver', async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;
        const { driver_id } = req.body as { driver_id?: number };

        if (!driver_id) {
            return res.status(400).json({ error: 'Driver ID is required' });
        }

        const driverCheck = await pool.query<{ driver_id: number }>(
            'SELECT driver_id FROM DRIVERS WHERE driver_id = $1',
            [driver_id]
        );

        if (driverCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        const result = await pool.query<Order>(
            'UPDATE ORDERS SET assigned_driver_id = $1 WHERE order_number = $2 RETURNING *',
            [driver_id, orderNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            message: 'Driver assigned successfully',
            order: result.rows[0]
        });

    } catch (error) {
        console.error('Assign driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/orders/:orderNumber/delivery-time', async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;
        const { actual_delivery_time, delivery_duration_minutes } = req.body as {
            actual_delivery_time?: string;
            delivery_duration_minutes?: number;
        };

        const result = await pool.query<Order>(
            `UPDATE ORDERS
             SET actual_delivery_time = $1,
                 delivery_duration_minutes = $2
             WHERE order_number = $3
             RETURNING *`,
            [actual_delivery_time, delivery_duration_minutes, orderNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            message: 'Delivery time updated successfully',
            order: result.rows[0]
        });

    } catch (error) {
        console.error('Update delivery time error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// 12. Loyalty Member Endpoints
// ============================================================================

interface LoyaltyRegistrationBody {
    first_name: string;
    last_name: string;
    email_address: string;
    phone_number: string;
    card_number: string;
    card_holder_name: string;
    card_expiry: string;
    card_cvv: string;
}

app.post('/api/loyalty-members/register', async (req: Request, res: Response) => {
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
        } = req.body as LoyaltyRegistrationBody;

        if (!first_name || !last_name || !email_address || !phone_number ||
            !card_number || !card_holder_name || !card_expiry || !card_cvv) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!/^[1-9]\d{9}$/.test(phone_number)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        const loyaltyNumber = generateLoyaltyNumber();

        const result = await pool.query<Pick<LoyaltyMember, 'loyalty_number' | 'first_name' | 'last_name' | 'email_address' | 'loyalty_points'>>(
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
        if (isPgError(error) && error.code === PG_UNIQUE_VIOLATION) {
            res.status(409).json({ error: 'Email address already registered' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.get('/api/loyalty-members/:loyaltyNumber', async (req: Request, res: Response) => {
    try {
        const { loyaltyNumber } = req.params;

        const result = await pool.query<Omit<LoyaltyMember, 'card_number' | 'card_holder_name' | 'card_expiry' | 'card_cvv'>>(
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
// 13. Staff Management Endpoints
// ============================================================================

app.post('/api/staff', async (req: Request, res: Response) => {
    try {
        const { first_name, last_name } = req.body as { first_name?: string; last_name?: string };

        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'First name and last name are required' });
        }

        const baseUsername = last_name.toLowerCase().substring(0, 8);
        const randomDigits = Math.floor(Math.random() * 90 + 10);
        const username = `${baseUsername}${randomDigits}`;

        const initialPassword = 'Staff' + Math.floor(Math.random() * 900 + 100);
        const hashedPassword = await hashPassword(initialPassword);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO ACCOUNT_LOGINS (username, password_hash, account_role, account_state)
                 VALUES ($1, $2, 'STAFF', 'ACTIVE')`,
                [username, hashedPassword]
            );

            const staffResult = await client.query<StaffMember>(
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

app.get('/api/staff', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query<StaffMember>(
            'SELECT * FROM STAFF_MEMBERS ORDER BY last_name, first_name'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/staff/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { account_status } = req.body as { account_status?: string };

        const validStatuses = ['ACTIVE', 'INACTIVE'];
        if (!account_status || !validStatuses.includes(account_status)) {
            return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or INACTIVE' });
        }

        const result = await pool.query<StaffMember>(
            'UPDATE STAFF_MEMBERS SET account_status = $1 WHERE staff_id = $2 RETURNING *',
            [account_status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        res.json({
            message: 'Staff member updated successfully',
            staff: result.rows[0]
        });

    } catch (error) {
        console.error('Update staff error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/staff/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const staffResult = await client.query<{ username: string }>(
                'SELECT username FROM STAFF_MEMBERS WHERE staff_id = $1',
                [id]
            );

            if (staffResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Staff member not found' });
            }

            const username = staffResult.rows[0].username;

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
// 14. Driver Management Endpoints
// ============================================================================

app.post('/api/drivers', async (req: Request, res: Response) => {
    try {
        const { driver_name } = req.body as { driver_name?: string };

        if (!driver_name) {
            return res.status(400).json({ error: 'Driver name is required' });
        }

        const result = await pool.query<Driver>(
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
        if (isPgError(error) && error.code === PG_UNIQUE_VIOLATION) {
            res.status(409).json({ error: 'Driver name already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.get('/api/drivers', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query<Driver>(
            'SELECT * FROM DRIVERS ORDER BY driver_name'
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/drivers/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body as { status?: string };

        const validStatuses = ['AVAILABLE', 'BUSY', 'OFFLINE'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query<Driver>(
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

app.delete('/api/drivers/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<Driver>(
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
// 15. Operating Hours Endpoints
// ============================================================================

interface OperatingHoursBody {
    day_of_week: string;
    opening_time?: string;
    closing_time?: string;
    is_closed?: boolean;
}

app.post('/api/restaurants/:id/hours', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { day_of_week, opening_time, closing_time, is_closed } = req.body as OperatingHoursBody;

        const result = await pool.query<OperatingHours>(
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

app.get('/api/restaurants/:id/hours', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query<OperatingHours>(
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
// 16. Error Handling Middleware
// ============================================================================

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// 17. Start Server
// ============================================================================

app.listen(PORT, () => {
    console.log('================================================');
    console.log('   FrontDash API Server');
    console.log('================================================');
    console.log(`✓ Server is running on port ${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log('================================================');
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});

export { app, pool };
