/**
 * FrontDash API Utility
 * =============================================================================
 * Centralized API client for communicating with the Express backend.
 * All frontend components should use these functions instead of direct fetch calls.
 * =============================================================================
 */

// Base URL for the Express backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || data.message || 'An error occurred',
      data
    );
  }

  return data as T;
}

// =============================================================================
// Authentication API
// =============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  role: 'ADMIN' | 'STAFF' | 'RESTAURANT';
  username: string;
  must_change_password?: boolean;
  staff_id?: number;
  restaurant_id?: number;
}

export interface ChangePasswordRequest {
  username: string;
  current_password: string;
  new_password: string;
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiFetch<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  changePassword: (data: ChangePasswordRequest) =>
    apiFetch<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// =============================================================================
// Restaurant API
// =============================================================================

export interface Restaurant {
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
  approved_at?: string;
}

export interface RestaurantRegistration {
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

export const restaurantApi = {
  // Get all approved restaurants (public)
  getAll: () =>
    apiFetch<Restaurant[]>('/api/restaurants'),

  // Get single restaurant by ID
  getById: (id: number) =>
    apiFetch<Restaurant>(`/api/restaurants/${id}`),

  /**
   * Fetch restaurant by URL slug for customer detail page.
   *
   * @param slug - URL-friendly name derived from restaurant name (e.g., "joes-pizza")
   * @returns The restaurant matching the slug
   * @throws {ApiError} with status 404 if restaurant not found
   *
   * @example
   * ```ts
   * try {
   *   const restaurant = await restaurantApi.getBySlug("joes-pizza");
   * } catch (err) {
   *   if (err instanceof ApiError && err.status === 404) {
   *     // Handle not found
   *   }
   * }
   * ```
   */
  getBySlug: (slug: string) =>
    apiFetch<Restaurant>(`/api/restaurants/by-slug/${slug}`),

  // Register new restaurant
  register: (data: RestaurantRegistration) =>
    apiFetch<{ message: string; restaurant: Restaurant; credentials: { username: string; password: string } }>(
      '/api/restaurants/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  // Update restaurant contact info
  update: (id: number, data: Partial<RestaurantRegistration>) =>
    apiFetch<{ message: string; restaurant: Restaurant }>(
      `/api/restaurants/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    ),

  // Admin: Approve restaurant
  approve: (id: number) =>
    apiFetch<{ message: string; restaurant: Restaurant }>(
      `/api/restaurants/${id}/approve`,
      { method: 'PUT' }
    ),

  // Admin: Reject restaurant
  reject: (id: number) =>
    apiFetch<{ message: string; restaurant_id: number }>(
      `/api/restaurants/${id}/reject`,
      { method: 'PUT' }
    ),

  // Request withdrawal
  requestWithdrawal: (id: number) =>
    apiFetch<{ message: string; restaurant: Restaurant }>(
      `/api/restaurants/${id}/withdraw`,
      { method: 'POST' }
    ),

  // Admin: Get withdrawal requests
  getWithdrawals: () =>
    apiFetch<Restaurant[]>('/api/restaurants/withdrawals'),

  // Admin: Approve withdrawal
  approveWithdrawal: (id: number) =>
    apiFetch<{ message: string; restaurant: Restaurant }>(
      `/api/restaurants/${id}/withdraw/approve`,
      { method: 'PUT' }
    ),

  // Admin: Reject withdrawal
  rejectWithdrawal: (id: number) =>
    apiFetch<{ message: string; restaurant: Restaurant }>(
      `/api/restaurants/${id}/withdraw/reject`,
      { method: 'PUT' }
    ),
};

// =============================================================================
// Staff API
// =============================================================================

export interface Staff {
  staff_id: number;
  first_name: string;
  last_name: string;
  username: string;
  account_status: 'ACTIVE' | 'INACTIVE';
  is_first_login: boolean;
  created_at: string;
}

export interface CreateStaffRequest {
  first_name: string;
  last_name: string;
}

export const staffApi = {
  getAll: () =>
    apiFetch<Staff[]>('/api/staff'),

  create: (data: CreateStaffRequest) =>
    apiFetch<{ message: string; staff: Staff; credentials: { username: string; password: string } }>(
      '/api/staff',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  delete: (id: number) =>
    apiFetch<{ message: string; staff_id: number }>(
      `/api/staff/${id}`,
      { method: 'DELETE' }
    ),
};

// =============================================================================
// Driver API
// =============================================================================

export interface Driver {
  driver_id: number;
  driver_name: string;
  driver_status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  hired_date: string;
}

export const driverApi = {
  getAll: () =>
    apiFetch<Driver[]>('/api/drivers'),

  hire: (name: string) =>
    apiFetch<{ message: string; driver: Driver }>(
      '/api/drivers',
      { method: 'POST', body: JSON.stringify({ driver_name: name }) }
    ),

  fire: (id: number) =>
    apiFetch<{ message: string; driver_id: number }>(
      `/api/drivers/${id}`,
      { method: 'DELETE' }
    ),

  updateStatus: (id: number, status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') =>
    apiFetch<{ message: string; driver: Driver }>(
      `/api/drivers/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ driver_status: status }) }
    ),
};

// =============================================================================
// Order API
// =============================================================================

export interface Order {
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
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  delivery_duration_minutes?: number;
  assigned_driver_id?: number;
  assigned_staff_id?: number;
  created_at: string;
}

export interface OrderItem {
  menu_item_id: number;
  quantity: number;
}

/** Order item detail returned when fetching a specific order */
export interface OrderItemDetail {
  order_item_id: number;
  order_number: string;
  menu_item_id: number;
  item_name: string;
  item_price: number;
  quantity: number;
}

export interface CreateOrderRequest {
  restaurant_id: number;
  loyalty_number?: string;
  guest_phone?: string;
  items: OrderItem[];
  tip_amount: number;
  delivery_address: {
    building_number: string;
    street_name: string;
    apartment?: string;
    city: string;
    state: string;
    zip_code: string;
  };
  contact_name: string;
  contact_phone: string;
}

export const orderApi = {
  getAll: (params?: { status?: string; restaurant_id?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.restaurant_id) searchParams.append('restaurant_id', String(params.restaurant_id));
    const query = searchParams.toString();
    return apiFetch<Order[]>(`/api/orders${query ? `?${query}` : ''}`);
  },

  getByOrderNumber: (orderNumber: string) =>
    apiFetch<{ order: Order; items: OrderItemDetail[] }>(`/api/orders/${orderNumber}`),

  create: (data: CreateOrderRequest) =>
    apiFetch<{ message: string; order_number: string; estimated_delivery_time: string; grand_total: number }>(
      '/api/orders',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  updateStatus: (orderNumber: string, status: Order['order_status']) =>
    apiFetch<{ message: string; order: Order }>(
      `/api/orders/${orderNumber}/status`,
      { method: 'PUT', body: JSON.stringify({ status }) }
    ),

  assignDriver: (orderNumber: string, driverId: number, staffId: number) =>
    apiFetch<{ message: string; order: Order }>(
      `/api/orders/${orderNumber}/assign-driver`,
      { method: 'PUT', body: JSON.stringify({ driver_id: driverId, staff_id: staffId }) }
    ),

  recordDeliveryTime: (orderNumber: string, deliveryTime: string) =>
    apiFetch<{ message: string; order: Order }>(
      `/api/orders/${orderNumber}/delivery-time`,
      { method: 'PUT', body: JSON.stringify({ delivery_time: deliveryTime }) }
    ),
};

// =============================================================================
// Menu Item API
// =============================================================================

export interface MenuItem {
  menu_item_id: number;
  restaurant_id: number;
  item_name: string;
  item_description?: string;
  item_image_url?: string;
  item_price: number;
  availability_status: 'AVAILABLE' | 'UNAVAILABLE';
  updated_at?: string;
}

export const menuApi = {
  getByRestaurant: (restaurantId: number) =>
    apiFetch<MenuItem[]>(`/api/restaurants/${restaurantId}/menu`),

  create: (restaurantId: number, item: Omit<MenuItem, 'menu_item_id' | 'restaurant_id' | 'updated_at'>) =>
    apiFetch<{ message: string; menu_item: MenuItem }>(
      `/api/restaurants/${restaurantId}/menu`,
      { method: 'POST', body: JSON.stringify(item) }
    ),

  update: (itemId: number, updates: Partial<MenuItem>) =>
    apiFetch<{ message: string; menu_item: MenuItem }>(
      `/api/menu-items/${itemId}`,
      { method: 'PUT', body: JSON.stringify(updates) }
    ),

  delete: (itemId: number) =>
    apiFetch<{ message: string; menu_item_id: number }>(
      `/api/menu-items/${itemId}`,
      { method: 'DELETE' }
    ),
};

// =============================================================================
// Operating Hours API
// =============================================================================

export interface OperatingHours {
  hours_id: number;
  restaurant_id: number;
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
}

export const hoursApi = {
  getByRestaurant: (restaurantId: number) =>
    apiFetch<OperatingHours[]>(`/api/restaurants/${restaurantId}/hours`),

  /** Update a single day's hours (uses upsert) */
  updateDay: (restaurantId: number, hours: Partial<OperatingHours>) =>
    apiFetch<{ message: string; hours: OperatingHours }>(
      `/api/restaurants/${restaurantId}/hours`,
      { method: 'POST', body: JSON.stringify(hours) }
    ),

  /** Update all days' hours (calls updateDay for each) */
  updateAll: async (restaurantId: number, allHours: Partial<OperatingHours>[]) => {
    const results = await Promise.all(
      allHours.map(hours => hoursApi.updateDay(restaurantId, hours))
    );
    return { message: 'All hours updated', hours: results.map(r => r.hours) };
  },
};

// =============================================================================
// Loyalty API
// =============================================================================

export interface LoyaltyMember {
  loyalty_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  loyalty_points: number;
  account_status: 'ACTIVE' | 'INACTIVE';
}

export const loyaltyApi = {
  getByNumber: (loyaltyNumber: string) =>
    apiFetch<LoyaltyMember>(`/api/loyalty-members/${loyaltyNumber}`),

  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    card_number: string;
    card_expiry: string;
    card_cvv: string;
  }) =>
    apiFetch<{ message: string; loyalty_number: string }>(
      '/api/loyalty-members/register',
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// =============================================================================
// Upload API (Presigned URLs for S3)
// =============================================================================

export interface PresignedUrlResponse {
  /** The presigned URL to upload the file to S3 */
  uploadUrl: string;
  /** The public URL where the image will be accessible after upload */
  imageUrl: string;
  /** How long the presigned URL is valid for (seconds) */
  expiresIn: number;
}

export const uploadApi = {
  /**
   * Get a presigned URL for uploading an image to S3.
   *
   * @param type - 'restaurant' for restaurant images, 'menu-item' for menu item images
   * @param id - ID of the restaurant or menu item
   * @param fileExtension - File extension (e.g., 'jpg', 'png')
   * @returns Presigned URL for upload and the final public URL
   *
   * @example
   * ```ts
   * // 1. Get presigned URL
   * const { uploadUrl, imageUrl } = await uploadApi.getPresignedUrl('restaurant', 1, 'jpg');
   *
   * // 2. Upload file directly to S3
   * await fetch(uploadUrl, {
   *   method: 'PUT',
   *   body: file,
   *   headers: { 'Content-Type': 'image/jpeg' }
   * });
   *
   * // 3. Update restaurant with the new image URL
   * await restaurantApi.update(1, { restaurant_image_url: imageUrl });
   * ```
   */
  getPresignedUrl: (type: 'restaurant' | 'menu-item', id: number, fileExtension: string) =>
    apiFetch<PresignedUrlResponse>('/api/uploads/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ type, id, fileExtension }),
    }),

  /**
   * Upload a file to S3 using a presigned URL.
   * Handles the complete upload flow: get URL, upload, return image URL.
   *
   * @param type - 'restaurant' or 'menu-item'
   * @param id - ID of the entity
   * @param file - File to upload
   * @returns The public URL of the uploaded image
   *
   * @example
   * ```ts
   * const imageUrl = await uploadApi.uploadImage('menu-item', 42, file);
   * await menuApi.update(42, { item_image_url: imageUrl });
   * ```
   */
  uploadImage: async (type: 'restaurant' | 'menu-item', id: number, file: File): Promise<string> => {
    // Extract file extension
    const extension = file.name.split('.').pop() || 'jpg';

    // Get presigned URL
    const { uploadUrl, imageUrl } = await uploadApi.getPresignedUrl(type, id, extension);

    // Upload directly to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new ApiError(uploadResponse.status, 'Failed to upload image to S3');
    }

    return imageUrl;
  },
};

// Export API_BASE_URL for reference
export { API_BASE_URL };
