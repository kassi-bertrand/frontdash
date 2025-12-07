/**
 * =============================================================================
 * TODO: REPLACE WITH BACKEND API CALLS
 * =============================================================================
 *
 * CURRENT STATE: Hardcoded mock data for restaurant dashboard
 * TARGET STATE: Fetch real data from Express backend based on logged-in restaurant
 *
 * BACKEND ENDPOINTS NEEDED:
 *
 * 1. ORDERS - GET /api/orders?restaurant_id={id}
 *    - Fetch orders for this restaurant
 *    - Map order_status: PENDING→NEW, CONFIRMED→PREPARING, etc.
 *    - Response: Order[]
 *
 * 2. MENU ITEMS - GET /api/restaurants/:id/menu
 *    - Fetch menu items for this restaurant
 *    - Response: MenuItem[]
 *
 * 3. OPERATING HOURS - GET /api/restaurants/:id/hours
 *    - Fetch weekly hours
 *    - Response: OperatingHours[]
 *
 * 4. CONTACT INFO - GET /api/restaurants/:id
 *    - Fetch restaurant details
 *    - Response: Restaurant
 *
 * FIELD MAPPINGS:
 *
 *   RestaurantOrder:
 *     order_number → id
 *     created_at → placedAt (format time)
 *     (join with order_items) → items
 *     delivery_contact_name → customer
 *     order_status → status (map: PENDING→NEW, CONFIRMED/PREPARING→PREPARING, etc.)
 *
 *   RestaurantMenuItem:
 *     menu_item_id → id
 *     item_name → name
 *     item_price → price
 *     availability_status → availability
 *     item_image_url → imageUrl
 *
 *   RestaurantHours:
 *     day_of_week → day (convert: 0→Sunday, 1→Monday, etc.)
 *     is_closed → !isOpen
 *     open_time → open
 *     close_time → close
 *
 *   RestaurantContactDetails:
 *     owner_name → contactPerson
 *     email_address → email
 *     phone_number → phoneNumbers[0]
 *     street_address → street
 *     city, state, zip_code → city, state, postalCode
 *
 * EXAMPLE CODE:
 *   import { orderApi, menuApi, restaurantApi } from '@/lib/api';
 *
 *   // Get restaurant ID from auth context/cookie
 *   const restaurantId = getLoggedInRestaurantId();
 *
 *   // Fetch all data in parallel
 *   const [orders, menuItems, restaurant] = await Promise.all([
 *     orderApi.getAll({ restaurant_id: restaurantId }),
 *     menuApi.getByRestaurant(restaurantId),
 *     restaurantApi.getById(restaurantId),
 *   ]);
 *
 * NOTES:
 *   - Restaurant ID should come from auth token/session after login
 *   - Insights (orders waiting, avg prep time) need to be calculated from orders
 *   - May need additional backend endpoint for aggregated stats
 * =============================================================================
 */

import { type RestaurantOrder } from './components/orders-table'

export type RestaurantInsight = {
  label: string
  value: string
  helper: string
}

export type RestaurantMenuItem = {
  id: string
  name: string
  price: number
  availability: 'AVAILABLE' | 'UNAVAILABLE'
  imageUrl?: string
}

export type RestaurantHours = {
  day: string
  isOpen: boolean
  open: string
  close: string
}

export type RestaurantContactDetails = {
  contactPerson: string
  email: string
  phoneNumbers: string[]
  street: string
  city: string
  state: string
  postalCode: string
  suite?: string
}

export const restaurantInsights: RestaurantInsight[] = [
  {
    label: 'Orders waiting for prep',
    value: '3',
    helper: 'Prioritize newest FrontDash tickets first',
  },
  {
    label: 'Average prep time today',
    value: '17 min',
    helper: 'Goal: keep under 20 minutes for delivery SLAs',
  },
  {
    label: 'FrontDash rating (mock)',
    value: '4.8 ★',
    helper: 'Reviews go live once the feedback API ships',
  },
]

export const restaurantOrders: RestaurantOrder[] = [
  {
    id: '#ORD-4312',
    placedAt: '12:52 PM',
    items: '2 × Citrus roasted chicken · 1 × Bright fennel salad',
    customer: 'Alex Chen',
    status: 'NEW',
  },
  {
    id: '#ORD-4311',
    placedAt: '12:37 PM',
    items: '1 × Herb focaccia · 3 × Whipped feta jars',
    customer: 'Jordan Ellis',
    status: 'PREPARING',
  },
  {
    id: '#ORD-4310',
    placedAt: '12:14 PM',
    items: '2 × Summer risotto · 2 × Lemon sorbet',
    customer: 'Priya Nair',
    status: 'PREPARING',
  },
  {
    id: '#ORD-4309',
    placedAt: '11:58 AM',
    items: '1 × Charred broccolini · 1 × Olive oil cake',
    customer: 'Chris Wallace',
    status: 'READY',
  },
  {
    id: '#ORD-4308',
    placedAt: '11:35 AM',
    items: '3 × Smoky tomato bisque',
    customer: 'Morgan Lake',
    status: 'COMPLETED',
  },
  {
    id: '#ORD-4307',
    placedAt: '11:20 AM',
    items: '4 × Roasted beet tartines',
    customer: 'Taylor Brooks',
    status: 'READY',
  },
  {
    id: '#ORD-4306',
    placedAt: '11:05 AM',
    items: '1 × Farro grain bowl · 2 × Blackberry mousse',
    customer: 'Jamie Rivera',
    status: 'COMPLETED',
  },
  {
    id: '#ORD-4305',
    placedAt: '10:52 AM',
    items: '3 × Smoked paprika cauliflower',
    customer: 'Lee Gardner',
    status: 'COMPLETED',
  },
]

export const restaurantMenuItems: RestaurantMenuItem[] = [
  {
    id: 'menu-olive-oil-cake',
    name: 'Olive oil citrus cake',
    price: 9.5,
    availability: 'AVAILABLE',
    imageUrl: '/images/menu/olive-oil-cake.png',
  },
  {
    id: 'menu-braised-fennel',
    name: 'Braised fennel + burrata',
    price: 14,
    availability: 'AVAILABLE',
    imageUrl: '/images/menu/braised-fennel.png',
  },
  {
    id: 'menu-citrus-chicken',
    name: 'Citrus roasted chicken',
    price: 18,
    availability: 'UNAVAILABLE',
    imageUrl: '/images/menu/citrus-chicken.png',
  },
]

export const restaurantHoursTemplate: RestaurantHours[] = [
  { day: 'Monday', isOpen: true, open: '10:00', close: '21:00' },
  { day: 'Tuesday', isOpen: true, open: '10:00', close: '21:00' },
  { day: 'Wednesday', isOpen: true, open: '10:00', close: '21:00' },
  { day: 'Thursday', isOpen: true, open: '10:00', close: '22:00' },
  { day: 'Friday', isOpen: true, open: '10:00', close: '23:00' },
  { day: 'Saturday', isOpen: true, open: '09:00', close: '23:00' },
  { day: 'Sunday', isOpen: false, open: '00:00', close: '00:00' },
]

export const restaurantContact: RestaurantContactDetails = {
  contactPerson: 'Morgan Ellis',
  email: 'ops@citrusandthyme.com',
  phoneNumbers: ['5125550198', '5125550103'],
  street: '410 Market Street',
  suite: 'Suite B',
  city: 'Austin',
  state: 'TX',
  postalCode: '78704',
}
